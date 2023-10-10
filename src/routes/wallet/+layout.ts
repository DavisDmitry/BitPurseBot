import { redirect } from '@sveltejs/kit'
import { mnemonicToSeed } from 'web-bip39'

import { PUBLIC_NET } from '$env/static/public'
import { type Callbacks, WasmWallet } from '$lib/wasm'

import type { LayoutLoad } from './$types'

async function createWasmWallet(seed: Uint8Array, net: 'main' | 'test') {
  const decoder = new TextDecoder()
  const memory = new WebAssembly.Memory({ initial: 17 })
  const callbacksContainer: { callbacks?: Callbacks } = {}
  const wasm = (
    await WebAssembly.instantiateStreaming(fetch('/wallet.wasm'), {
      env: {
        memory,
        ret: (offset: number, length: number) => {
          if (callbacksContainer.callbacks?.ret)
            callbacksContainer.callbacks.ret(
              new Uint8Array(memory.buffer, offset, length)
            )
        },
        ask: (offset: number, length: number) => {
          if (callbacksContainer.callbacks?.ask)
            callbacksContainer.callbacks.ask(
              new Uint8Array(memory.buffer, offset, length)
            )
        },
        err: (offset: number, length: number) => {
          if (callbacksContainer.callbacks?.err) {
            const data = new Uint8Array(memory.buffer, offset, length)
            callbacksContainer.callbacks.err(decoder.decode(data))
          }
        }
      }
    })
  ).instance
  return new WasmWallet(memory, wasm, callbacksContainer, seed, net)
}

export const load = (async ({ parent }) => {
  const net = PUBLIC_NET as 'main' | 'test'
  const { userId } = await parent()
  if (!userId) throw redirect(303, '/')
  const mnemonic = localStorage.getItem(`${userId}:bitpurse:mnemonic`)
  if (!mnemonic) throw redirect(303, '/mnemonic')
  return {
    wasmWallet: await createWasmWallet(await mnemonicToSeed(mnemonic), net),
    net
  }
}) satisfies LayoutLoad
