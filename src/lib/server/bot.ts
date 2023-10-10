import { Composer, type Context as DefaultContext } from 'grammy'

import { PUBLIC_APP_URL } from '$env/static/public'
import type { UsersRepository } from '$lib/server/users'

export interface Context extends DefaultContext {
  usersRepository?: UsersRepository
}

export const composer = new Composer<Context>()

composer.command('start', async (ctx) => {
  if (!ctx.message?.from) return // never
  if (ctx.usersRepository) {
    const user = await ctx.usersRepository.getOrCreate(ctx.message.from.id, true)
    if (!user.botCanWrite)
      await ctx.usersRepository.update({ id: user.id, botCanWrite: true })
  }
  return await ctx.reply('<b>Hello!</b>', {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🚀 Open', web_app: { url: PUBLIC_APP_URL } }],
        [{ text: '🐱 Code', url: 'https://github.com/DavisDmitry/BitPurseBot' }]
      ]
    }
  })
})

composer.on('my_chat_member', async (ctx) => {
  if (ctx.myChatMember.new_chat_member.status !== 'kicked') return
  if (!ctx.usersRepository) return
  await ctx.usersRepository.update({ id: ctx.myChatMember.from.id, botCanWrite: false })
})
