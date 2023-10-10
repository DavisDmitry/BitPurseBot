import type Amount from '$lib/Amount'

interface TransactionBase {
  txid: string
  type: 'deposit' | 'withdrawal'
  amount: Amount
}

export interface ConfirmedTransaction extends TransactionBase {
  confirmed: true
  blockHash: string
}

export interface UnconfirmedTransaction extends TransactionBase {
  confirmed: false
}

/**
 * Transaction data from mempool or blockchain.
 */
export type Transaction = ConfirmedTransaction | UnconfirmedTransaction
