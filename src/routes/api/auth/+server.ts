import { error, type RequestHandler } from '@sveltejs/kit'
import { validate } from '@tma.js/init-data-node'
import type { TelegramWebApps } from 'telegram-webapps'

import { env } from '$env/dynamic/private'

export const POST = (async ({ request, locals }) => {
  const initDataString = await request.text()
  try {
    validate(initDataString, env.BOT_TOKEN)
  } catch (err) {
    if (err instanceof Error) throw error(401, err.message)
    throw error(401, String(err))
  }
  const initData = new URLSearchParams(initDataString)
  const user: TelegramWebApps.WebAppUser | null = JSON.parse(
    initData.get('user') ?? 'null'
  )
  if (!user) throw error(401, 'User field required in init data.')
  if (locals.usersRepository) {
    await locals.usersRepository.getOrCreate(user.id, false)
  }
  return new Response(String(user.id), { status: 200 })
}) satisfies RequestHandler
