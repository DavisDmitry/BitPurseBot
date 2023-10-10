import type { RequestHandler } from '@sveltejs/kit'
import { Bot, webhookCallback } from 'grammy/web'

import { env } from '$env/dynamic/private'
import { composer, type Context } from '$lib/server/bot'

export const POST = (({ request, locals }) => {
  const bot = new Bot<Context>(env.BOT_TOKEN, {
    client: { canUseWebhookReply: () => true }
  })
  if (locals.usersRepository) {
    if (!env.PB_EMAIL || !env.PB_PASSWORD)
      throw new Error('Required env variables not specified (for PocketBase)')
    bot.use((ctx, next) => {
      ctx.usersRepository = locals.usersRepository
      return next()
    })
  }
  bot.use(composer)
  const callback = webhookCallback(bot, 'sveltekit', { secretToken: env.WEBHOOK_SECRET })
  return callback({ request })
}) satisfies RequestHandler
