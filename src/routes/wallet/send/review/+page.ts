import { redirect } from '@sveltejs/kit'
import { get } from 'svelte/store'

import type { PageLoad } from './$types'

export const load = (async ({ parent }) => {
  const data = await parent()
  const payment = get(data.paymentStore)
  if (payment) return { payment }
  throw redirect(303, '/wallet/send')
}) satisfies PageLoad
