import { redirect } from '@sveltejs/kit'
import { generateMnemonic } from 'web-bip39'

import type { PageLoad } from './$types'

export const load = (async ({ parent }) => {
  const { userId } = await parent()
  if (!userId) throw redirect(303, '/')
  const mnemonicKey = `${userId}:bitpurse:mnemonic`
  let mnemonic = localStorage.getItem(mnemonicKey)
  if (!mnemonic) {
    const wordlist = (await import('web-bip39/wordlists/english')).default
    mnemonic = await generateMnemonic(wordlist, 256)
    localStorage.setItem(mnemonicKey, mnemonic)
  }
  return { mnemonic }
}) satisfies PageLoad
