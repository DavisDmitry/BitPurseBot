<script lang="ts">
  import { onDestroy, onMount } from 'svelte'

  import { goto } from '$app/navigation'
  import FilledTonalCommonButton from '$lib/components/FilledTonalCommonButton.svelte'
  import List from '$lib/components/List'
  import { useTransactionsService } from '$lib/providers/ServicesProvider.svelte'

  import type { PageData } from './$types'

  export let data: PageData

  let txid: string | undefined

  const sendMutation = useTransactionsService().sendPayment(
    data.payment,
    data.wasmWallet.address
  )

  const onClickBackButton = () => goto('/wallet/send')

  function onClickMainButton() {
    Telegram.WebApp.MainButton.showProgress()
    $sendMutation.mutate(undefined, {
      onSuccess: (data) => {
        txid = data
        Telegram.WebApp.HapticFeedback.notificationOccurred('success')
        Telegram.WebApp.MainButton.hideProgress()
        Telegram.WebApp.MainButton.hide()
      },
      onError: (err) => {
        console.log(err)
        Telegram.WebApp.HapticFeedback.notificationOccurred('error')
        Telegram.WebApp.showAlert(
          'Unexpected error. Mini app will be closed.',
          Telegram.WebApp.close
        )
      }
    })
  }

  onMount(Telegram.WebApp.enableClosingConfirmation)
  onMount(Telegram.WebApp.expand)
  onMount(() => {
    Telegram.WebApp.BackButton.onClick(onClickBackButton)
    Telegram.WebApp.BackButton.show()
  })
  onMount(() => {
    Telegram.WebApp.MainButton.onClick(onClickMainButton)
    Telegram.WebApp.MainButton.setParams({
      text: 'Confirm',
      is_active: true,
      is_visible: true
    })
  })
  onDestroy(() => Telegram.WebApp.BackButton.offClick(onClickBackButton))
  onDestroy(() => Telegram.WebApp.MainButton.offClick(onClickMainButton))
  onDestroy(Telegram.WebApp.disableClosingConfirmation)
</script>

<List let:ListItem>
  <h3 class="text-title-large ml-4 my-2">
    {txid ? 'Payment sent' : 'Review transaction'}
  </h3>
  {#if txid}
    <ListItem>
      Transaction ID
      <svelte:fragment slot="text">{txid}</svelte:fragment>
    </ListItem>
  {/if}
  <ListItem>
    Recipient
    <svelte:fragment slot="text">
      {data.payment.recipientAddress}
    </svelte:fragment>
  </ListItem>
  <ListItem>
    Amount
    <svelte:fragment slot="text">
      {data.payment.amount.btc} BTC
    </svelte:fragment>
  </ListItem>
  <ListItem>
    Fee per byte
    <svelte:fragment slot="text">
      {data.payment.feePerByte} Satoshi
    </svelte:fragment>
  </ListItem>
  <ListItem>
    Total fee
    <svelte:fragment slot="text">
      {data.payment.totalFee.btc} BTC
    </svelte:fragment>
  </ListItem>
  {#if txid}
    <!-- svelte-ignore missing-declaration -->
    <FilledTonalCommonButton
      on:click={() =>
        Telegram.WebApp.openLink(
          `https://blockstream.info/${data.net === 'main' ? '' : 'testnet/'}tx/${txid}`
        )}
      class="mx-auto my-2"
    >
      Explorer
      <svelte:fragment slot="icon">
        <svg
          class="w-full h-full"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 -960 960 960"
        >
          <path
            d="M440-280H280q-83 0-141.5-58.5T80-480q0-83 58.5-141.5T280-680h160v80H280q-50
            0-85 35t-35 85q0 50 35 85t85 35h160v80ZM320-440v-80h320v80H320Zm200
            160v-80h160q50 0 85-35t35-85q0-50-35-85t-85-35H520v-80h160q83 0 141.5
            58.5T880-480q0 83-58.5 141.5T680-280H520Z"
          />
        </svg>
      </svelte:fragment>
    </FilledTonalCommonButton>
  {/if}
</List>
