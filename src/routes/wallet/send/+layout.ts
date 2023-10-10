import { writable } from 'svelte/store'

import type { Payment } from '$lib/payments'

import type { LayoutLoad } from './$types'

export const load = (() => {
  return { paymentStore: writable<Payment | undefined>() }
}) satisfies LayoutLoad
