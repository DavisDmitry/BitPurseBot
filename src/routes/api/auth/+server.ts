import { error, type RequestHandler } from '@sveltejs/kit'
import type { TelegramWebApps } from 'telegram-webapps'

import { env } from '$env/dynamic/private'

const initDataExpiresIn = 86400000 // 1 day

function importKey(key: BufferSource): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign'
  ])
}

async function validate(sp: URLSearchParams): Promise<void> {
  let authDate = new Date(0)
  let hash = ''

  const pairs: string[] = []
  sp.forEach((value, key) => {
    if (key === 'hash') {
      hash = value
      return
    }
    if (key === 'auth_date') {
      const authDateNum = parseInt(value, 10)

      if (Number.isNaN(authDateNum)) {
        throw new TypeError('"auth_date" should present integer')
      }
      authDate = new Date(authDateNum * 1000)
    }
    pairs.push(`${key}=${value}`)
  })

  if (hash.length === 0) {
    throw new Error('"hash" is empty or not found')
  }
  if (authDate.getTime() === 0) {
    throw new Error('"auth_date" is empty or not found')
  }
  if (authDate.getTime() + initDataExpiresIn < new Date().getTime()) {
    throw new Error('Init data expired')
  }

  pairs.sort()

  const encoder = new TextEncoder()

  const secretKey = await importKey(encoder.encode('WebAppData'))
    .then((key) =>
      crypto.subtle.sign(
        { name: 'HMAC', hash: 'SHA-256' },
        key,
        encoder.encode(env.BOT_TOKEN)
      )
    )
    .then((key) => importKey(key))

  const computedHash = [
    ...new Uint8Array(
      await crypto.subtle.sign(
        { name: 'HMAC', hash: 'SHA-256' },
        secretKey,
        encoder.encode(pairs.join('\n'))
      )
    )
  ]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')

  if (computedHash !== hash) {
    throw new Error('Signature is invalid')
  }
}

export const POST = (async ({ request, locals }) => {
  const initData = new URLSearchParams(await request.text())

  try {
    validate(initData)
  } catch (err) {
    if (err instanceof Error) throw error(401, err.message)
    throw error(401, String(err))
  }

  const user: TelegramWebApps.WebAppUser | null = JSON.parse(
    initData.get('user') ?? 'null'
  )
  if (!user) throw error(401, 'User field required in init data.')

  if (locals.usersRepository) {
    await locals.usersRepository.getOrCreate(user.id, false)
  }

  return new Response(String(user.id), { status: 200 })
}) satisfies RequestHandler
