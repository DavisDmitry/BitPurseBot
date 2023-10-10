import type Amount from '$lib/Amount'

export interface PaymentSentEvent {
  txid: string
  amount: Amount
  fromAddress: string
  toAddress: string
}
export type PaymentSentSubscriber = (event: PaymentSentEvent) => void
