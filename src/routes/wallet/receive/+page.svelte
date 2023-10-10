<script lang="ts">
  import { useQuery } from '@sveltestack/svelte-query'
  import { onDestroy, onMount } from 'svelte'

  import { goto } from '$app/navigation'

  import type { PageData } from './$types'
  import QRWorker from './QRWorker?worker&inline'

  export let data: PageData

  let addressElement: HTMLSpanElement

  const address = data.wasmWallet.address
  const halfAddressLen = address.length / 2

  const qrQuery = useQuery(
    'addressQR',
    () =>
      new Promise<string>((resolve) => {
        const worker = new QRWorker()
        const listener = (event: MessageEvent<string>) => {
          resolve(event.data)
          worker.removeEventListener('message', listener)
        }
        worker.addEventListener('message', listener)
        worker.postMessage(address)
      }),
    { staleTime: Infinity }
  )

  const onClickBackButton = () => goto('/wallet')

  function copyAddress() {
    // todo: snackbar
    const range = document.createRange()
    range.selectNodeContents(addressElement)
    window.getSelection()?.addRange(range)
    document.execCommand('copy')
    Telegram.WebApp.HapticFeedback.notificationOccurred('success')
  }
  onMount(() => {
    Telegram.WebApp.BackButton.onClick(onClickBackButton)
    Telegram.WebApp.BackButton.show()
  })
  onDestroy(() => Telegram.WebApp.BackButton.offClick(onClickBackButton))
</script>

<div class="flex flex-col text-center py-8 gap-8">
  <h1 class="text-headline-medium">Receive Bitcoin</h1>
  <div
    class="p-4 w-fit mx-auto rounded-xl bg-surface-container-highest
      text-on-surface text-body-small"
  >
    {#if $qrQuery.isSuccess}
      <img src={$qrQuery.data} alt="QR code" class="mx-auto mb-4 w-48 h-48" />
    {:else}
      <div class="mx-auto mb-4 w-48 h-48 bg-surface-container" />
    {/if}
    <button class="mb-1" on:click={copyAddress}>
      <span bind:this={addressElement} class="font-mono">
        {data.wasmWallet.address.slice(0, halfAddressLen)}
        <br />
        {data.wasmWallet.address.slice(halfAddressLen)}
      </span>
    </button>
    <div class="text-on-surface-variant">Your Bitcoin {data.net}net address</div>
  </div>
</div>
