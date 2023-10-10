import type { Handle } from '@sveltejs/kit'
import PocketBase from 'pocketbase'

import { env } from '$env/dynamic/private'
import { PocketBaseUsersRepository } from '$lib/server/users'

export const handle = (async ({ event, resolve }) => {
  if (['/api/bot', '/api/auth'].includes(event.url.pathname) && env.PB_URL) {
    if (!env.PB_EMAIL || !env.PB_PASSWORD)
      throw new Error('Required env variables not specified (for PocketBase)')
    const pb = new PocketBase(env.PB_URL)
    await pb.admins.authWithPassword(env.PB_EMAIL, env.PB_PASSWORD)
    event.locals.usersRepository = new PocketBaseUsersRepository(pb)
  }
  return await resolve(event)
}) satisfies Handle
