import type Amount from '$lib/Amount'

/**
 * Unspent transaction output.
 */
export interface UTXO {
  txid: string
  index: number
  amount: Amount
  confirmed: boolean
  blockHeight: number
}
