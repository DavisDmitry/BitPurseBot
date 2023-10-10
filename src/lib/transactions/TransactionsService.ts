import { useMutation, useQueryClient } from '@sveltestack/svelte-query'

import { CantSendUnsignedError, type Payment } from '$lib/payments'
import { useTransactionsRepository } from '$lib/providers/RepositoriesProvider.svelte'

import type { Transaction } from './types'

export default class TransactionsService {
  protected readonly repository
  protected readonly queryClient

  constructor() {
    this.repository = useTransactionsRepository()
    this.queryClient = useQueryClient()
  }

  sendPayment(payment: Payment, fromAddress: string) {
    if (!payment.signed) throw new CantSendUnsignedError()
    const { amount } = payment
    return useMutation(() => this.repository.sendHex(payment.toHex()), {
      onSuccess: (txid) => {
        this.queryClient.setQueryData<Transaction[]>(
          ['transactions', { address: fromAddress }],
          (oldTransactions) => {
            oldTransactions = oldTransactions ?? []
            return [
              { txid, type: 'withdrawal', amount, confirmed: false },
              ...oldTransactions
            ]
          }
        )
      }
    })
  }
}
