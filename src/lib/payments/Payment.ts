import { decode as decodeAddress, type UTXO } from '$lib/addresses'
import Amount from '$lib/Amount'
import { bytesToHex, hexToBytes, intToBytes } from '$lib/utils'
import type { WasmWallet } from '$lib/wasm'

import { InsufficientBalanceError, SignFailedError } from './errors'

export default class Payment {
  #signed = false
  readonly totalAmount = new Amount(0n)
  readonly totalFee = new Amount(0n)
  protected raw
  protected readonly amounts
  protected readonly inputCount

  constructor(
    readonly recipientAddress: string,
    readonly amount: Amount,
    readonly feePerByte: bigint,
    utxos: UTXO[],
    changePublicKeyHash: Uint8Array,
    net: 'main' | 'test'
  ) {
    const recipient = decodeAddress(recipientAddress, net)
    const { totalAmount, totalFee, inputs, needChange } = Payment.pickUtxos(
      utxos,
      amount,
      feePerByte
    )
    console.log(inputs)
    Object.assign(this, { totalAmount, totalFee })
    const inputLen = 41 // txid(32) + output index (4) + scipt length (1) + nsequence (4)
    const inputsStart = 7 // after nversion (4), marker (1), flag (1)
    const inputsEnd = inputsStart + inputLen * inputs.length
    // output script is 0014<20-byte-public-key>; 0x16 — length
    const outputScriptPrefix = [0x16, 0x00, 0x14] as const
    const outputsStart = inputsEnd + 1
    const outputLen = 31 // amount (8) + script length (1) + script (22)
    const outputsEnd = outputsStart + outputLen * (needChange ? 2 : 1)
    const txLen = outputsEnd + 4 // 4 for nlocktime
    this.raw = new Uint8Array(txLen)
    this.amounts = new Uint8Array(8 * inputs.length)
    this.raw.set([1, 0, 0, 0]) // nversion
    this.raw[4] = 0 // marker
    this.raw[5] = 1 // flag
    this.raw[6] = inputs.length
    inputs.forEach((input, index) => {
      this.raw.set(
        [
          ...hexToBytes(input.txid).reverse(),
          ...intToBytes(input.index, 4).reverse(), // 4 — length of u32
          0, // input script length
          ...intToBytes(0xffffffff, 8) // nsequence
        ],
        inputsStart + index * inputLen
      )
      this.amounts.set(intToBytes(input.amount.satoshi, 8).reverse(), index * 8)
    })
    this.raw[inputsEnd] = 1 // output count
    this.raw.set(
      [...intToBytes(amount.satoshi, 8).reverse(), ...outputScriptPrefix, ...recipient],
      outputsStart
    )
    if (needChange) {
      this.raw[inputsEnd] += 1 // output count
      this.raw.set(
        [
          ...intToBytes(totalAmount.sub(amount).sub(totalFee).satoshi, 8).reverse(),
          ...outputScriptPrefix,
          ...changePublicKeyHash
        ],
        outputsStart + outputLen
      )
    }
    this.raw.set(intToBytes(0, 4), outputsEnd) // nlocktime
    this.inputCount = inputs.length
  }

  get signed() {
    return this.#signed
  }

  sign(wasmWallet: WasmWallet) {
    if (this.signed) return
    let ask: 'tx' | 'amounts' | 'random' = 'tx'
    let error: SignFailedError | undefined
    wasmWallet.setupCallbacks({
      ret: (signed) => (this.raw = signed),
      ask: (data) => {
        switch (ask) {
          case 'tx': {
            data.set(this.raw)
            ask = 'amounts'
            break
          }
          case 'amounts': {
            data.set(this.amounts)
            ask = 'random'
            break
          }
          default:
            crypto.getRandomValues(data)
        }
      },
      err: (message) => (error = new SignFailedError(`Internal: ${message}`))
    })
    wasmWallet.exports.signTx(this.raw.length, this.inputCount)
    wasmWallet.resetCallbacks()
    if (error) throw error
    this.#signed = true
  }

  protected static pickUtxos(utxos: UTXO[], amount: Amount, feePerByte: bigint) {
    utxos.sort((a, b) => a.blockHeight - b.blockHeight)
    const inputWeight = 68n
    const outputWeight = 31n
    /*
      1 output (31) + nversion (1) + marker (4) + flag (4) + input count (1/4)
      + output count (1/4) = 40.5 =ceil=> 41
      https://bitcoin.stackexchange.com/questions/87275/how-to-calculate-segwit-transaction-fee-in-bytes
    */
    let totalFee = new Amount(41n * feePerByte)
    let totalAmount = new Amount(0n)
    const inputs: UTXO[] = []
    let i = 0
    while (totalAmount.lt(amount.add(totalFee))) {
      if (!utxos[i]) throw new InsufficientBalanceError(totalFee.satoshi / feePerByte)
      totalAmount = totalAmount.add(utxos[i].amount)
      inputs.push(utxos[i])
      totalFee = totalFee.add(inputWeight * feePerByte)
      i += 1
    }
    if (
      totalAmount
        .sub(amount)
        .add(totalFee)
        .le(outputWeight * feePerByte)
    ) {
      return { totalAmount, totalFee, inputs, needChange: false }
    }
    totalFee = totalFee.add(outputWeight * feePerByte)
    return { totalAmount, totalFee, inputs, needChange: true }
  }

  toHex() {
    return bytesToHex(this.raw)
  }
}
