import { setTheme } from '$lib/utils'

import type { LayoutLoad } from './$types'

export const ssr = false

export const load = (async ({ fetch }) => {
  setTheme()
  Telegram.WebApp.onEvent('themeChanged', setTheme)
  const authResp = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: Telegram.WebApp.initData
  })
  Telegram.WebApp.ready()
  if (!authResp.ok) return
  return {
    userId: await authResp.text()
  }
}) satisfies LayoutLoad
