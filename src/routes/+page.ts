import { redirect } from '@sveltejs/kit'

import { PUBLIC_BOT_USERNAME } from '$env/static/public'

import type { PageLoad } from './$types'

export const load = (async ({ parent }) => {
  const { userId } = await parent()
  if (!userId) return { botUsername: PUBLIC_BOT_USERNAME }
  if (localStorage.getItem(`${userId}:bitpurse:mnemonic`)) throw redirect(303, '/wallet')
  throw redirect(303, '/mnemonic')
}) satisfies PageLoad
