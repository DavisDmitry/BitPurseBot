import { useQuery, useQueryClient } from '@sveltestack/svelte-query'

import Amount from '$lib/Amount'
import { useAddressesRepository } from '$lib/providers/RepositoriesProvider.svelte'

import type { UTXO } from './types'

export default class {
  protected readonly repository
  protected readonly queryClient

  constructor(protected readonly address: string) {
    this.repository = useAddressesRepository()
    this.queryClient = useQueryClient()
  }

  /**
   * Get unspent transaction outputs associated with this address.
   */
  getUtxos() {
    return useQuery('utxos', () => this.repository.getUtxos(this.address))
  }

  /**
   * Get latest transactions associated with this address from mempool and blockhain.
   */
  getTransactions() {
    return useQuery(['transactions', { address: this.address }], () =>
      this.repository.getTransactions(this.address)
    )
  }

  /**
   * Get balance of the address.
   */
  getBalance() {
    return useQuery('balance', async () => {
      let utxos = this.queryClient.getQueryData<UTXO[]>('utxos')
      if (!utxos) {
        utxos = await this.repository.getUtxos(this.address)
        this.queryClient.setQueryData('utxos', () => utxos)
      }
      return utxos.reduce((balance, utxo) => balance.add(utxo.amount), new Amount(0n))
    })
  }
}
