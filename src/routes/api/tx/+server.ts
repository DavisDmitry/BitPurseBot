import { PUBLIC_NET } from '$env/static/public'
import { getEsploraBasePath } from '$lib/utils'

import type { RequestHandler } from './$types'

export const POST = (async ({ request, fetch }) => {
  return await fetch(`${getEsploraBasePath(PUBLIC_NET as 'main' | 'test')}/tx`, {
    method: 'POST',
    body: await request.text()
  })
}) satisfies RequestHandler
