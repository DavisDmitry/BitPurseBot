import type { AddressApi } from '@interlay/esplora-btc-api'

import Amount from '$lib/Amount'
import { EsploraTransactionsRepository, type Transaction } from '$lib/transactions'

import type { UTXO } from './types'

export interface AddressesRepository {
  getUtxos(address: string): Promise<UTXO[]>
  getTransactions(address: string): Promise<Transaction[]>
}

export class EsploraAddressesRepository implements AddressesRepository {
  constructor(protected readonly api: AddressApi) {}

  async getUtxos(address: string) {
    const resp = await this.api.getAddressUtxo(address)
    return resp.data.map(({ txid, vout, value, status }) => ({
      txid,
      index: vout,
      amount: new Amount(BigInt(value)),
      confirmed: status?.confirmed ?? false,
      blockHeight: status?.block_height ?? Number.MAX_SAFE_INTEGER
    }))
  }

  async getTransactions(address: string) {
    const resp = await this.api.getAddressTxHistory(address)
    return resp.data.map((tx) =>
      EsploraTransactionsRepository.buildTransaction(tx, address)
    )
  }
}
