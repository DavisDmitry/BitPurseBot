import type { Transaction as EsploraTx, TxApi } from '@interlay/esplora-btc-api'

import Amount from '$lib/Amount'

import type { Transaction } from './types'

export interface TransactionsRepository {
  sendHex(transaction: string): Promise<string>
}

export class EsploraTransactionsRepository implements TransactionsRepository {
  constructor(protected readonly api: TxApi) {}

  static buildTransaction(tx: EsploraTx, address: string): Transaction {
    let amount = new Amount(0n)
    tx.vin?.forEach(({ prevout }) => {
      if (prevout?.scriptpubkey_address === address)
        amount = amount.sub(BigInt(prevout.value ?? 0))
    })
    tx.vout?.forEach((out) => {
      if (out.scriptpubkey_address === address)
        amount = amount.add(BigInt(out.value ?? 0))
    })
    let type: 'deposit' | 'withdrawal'
    if (amount.ge(0n)) type = 'deposit'
    else {
      amount = amount.mul(-1n)
      type = 'withdrawal'
    }
    if (tx.status?.confirmed && tx.status?.block_hash)
      return {
        txid: tx.txid,
        type,
        amount,
        confirmed: tx.status.confirmed,
        blockHash: tx.status.block_hash
      }
    return { txid: tx.txid, type, amount, confirmed: false }
  }

  async sendHex(transaction: string) {
    return (await this.api.postTx(transaction)).data
  }
}

export class WrappedEsploraTransactionsRepository extends EsploraTransactionsRepository {
  constructor(esploraApi: TxApi, protected readonly internal: TxApi) {
    super(esploraApi)
  }

  async sendHex(transaction: string) {
    return (await this.internal.postTx(transaction)).data
  }
}
