<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte'

  import { goto } from '$app/navigation'
  import { AddressesService, decode as decodeAddress } from '$lib/addresses'
  import Amount from '$lib/Amount'
  import FilledTonalIconButton from '$lib/components/FilledTonalIconButton.svelte'
  import InputOutline from '$lib/components/InputOutline.svelte'
  import { InsufficientBalanceError, Payment } from '$lib/payments'
  import { useAddressesService } from '$lib/providers/ServicesProvider.svelte'

  import type { PageData } from './$types'

  export let data: PageData

  const addressesService = useAddressesService()
  const utxosQuery = addressesService.getUtxos()
  $: utxos = $utxosQuery.data
  let balanceQuery: ReturnType<AddressesService['getBalance']> | undefined
  $: {
    if (utxos) balanceQuery = addressesService.getBalance()
  }
  $: balance = $balanceQuery?.data

  let address: string | undefined
  let addressValid = false
  let amountString: string | undefined
  let amount: Amount | undefined
  let amountValid = false
  let feeString: string | undefined
  let fee: bigint | undefined
  let feeValid = false
  const minFee = data.net === 'main' ? 5n : 1n
  let maxFee: bigint | undefined

  const onClickBackButton = () => goto('/wallet')

  function onClickMainButton() {
    if (!address || !amount || !fee || !utxos || !balance) {
      Telegram.WebApp.HapticFeedback.notificationOccurred('error')
      Telegram.WebApp.MainButton.disable()
      return
    }
    try {
      const payment = new Payment(
        address,
        amount,
        fee,
        utxos,
        data.wasmWallet.publicKeyHash,
        data.net
      )
      payment.sign(data.wasmWallet)
      data.paymentStore.set(payment)
    } catch (err) {
      Telegram.WebApp.HapticFeedback.notificationOccurred('error')
      if (err instanceof InsufficientBalanceError) {
        maxFee = balance.sub(amount).satoshi / err.bytes
        fee -= 1n // to update validty
        tick().then(() => {
          if (fee) fee += 1n
        })
        Telegram.WebApp.showAlert('Insufficient funds. Try reducing the amount or fee.')
        return
      }
      console.log(err)
      Telegram.WebApp.showAlert(
        'Unexpected error. Mini app will be closed.',
        Telegram.WebApp.close
      )
    }
    Telegram.WebApp.HapticFeedback.notificationOccurred('success')
    goto('/wallet/send/review')
  }

  function validateAddress(address: string) {
    try {
      decodeAddress(address, data.net)
    } catch {
      return 'Invalid or unsupported address'
    }
  }

  function onClickScanQr() {
    Telegram.WebApp.HapticFeedback.notificationOccurred('success')
    Telegram.WebApp.showScanQrPopup({}, (data) => {
      const match = /^bitcoin:(\w*)$/gm.exec(data)
      if (!match || !match[1]) {
        Telegram.WebApp.HapticFeedback.notificationOccurred('error')
        Telegram.WebApp.showAlert('Bitcoin address not found.')
        return true
      }
      address = match[1]
      tick().then(() => {
        if (addressValid) Telegram.WebApp.HapticFeedback.notificationOccurred('success')
        else Telegram.WebApp.HapticFeedback.notificationOccurred('error')
      })
      return true
    })
  }

  $: {
    if (amountString) {
      amountString = amountString.replaceAll(/[^\d.]/gm, '')
      const splited = amountString.split('.', 2)
      if (splited[1]) {
        splited[1].replaceAll('.', '')
        if (splited[1].length > 8) {
          splited[1] = splited[1].slice(0, 8)
        }
      }
      amountString = splited.join('.')
    }
  }

  function validateAmount(amountString: string) {
    if (!balance) return
    amount = Amount.fromBtc(amountString)
    if (amount.gt(balance)) {
      return `Amount greater than balance. Balance: ${balance.btc}.`
    }
  }

  $: feeString = feeString?.replaceAll(/\D/gm, '')

  function validateFee(feeString: string) {
    fee = BigInt(feeString)
    if (fee < minFee) return 'Too small fee. Min: 5 satoshi.'
    if (maxFee && fee > maxFee) return 'Too big fee.'
  }

  $: {
    if (address && addressValid && amount && amountValid && fee && feeValid)
      Telegram.WebApp.MainButton.enable()
    else Telegram.WebApp.MainButton.disable()
  }

  onMount(Telegram.WebApp.enableClosingConfirmation)
  onMount(() => {
    Telegram.WebApp.BackButton.onClick(onClickBackButton)
    Telegram.WebApp.BackButton.show()
  })
  onMount(() => {
    Telegram.WebApp.MainButton.onClick(onClickMainButton)
    Telegram.WebApp.MainButton.setParams({
      text: 'Send',
      is_active: false,
      is_visible: true
    })
  })
  onDestroy(Telegram.WebApp.disableClosingConfirmation)
  onDestroy(() => Telegram.WebApp.BackButton.offClick(onClickBackButton))
  onDestroy(() => Telegram.WebApp.MainButton.offClick(onClickMainButton))
</script>

<form class="flex flex-col p-8">
  <div class="flex flex-row gap-4 w-full">
    <InputOutline
      id="address"
      class="bg-background"
      bind:value={address}
      bind:valid={addressValid}
      validator={validateAddress}
    >
      Address
    </InputOutline>
    <FilledTonalIconButton class="mt-2" on:click={onClickScanQr}>
      <svg
        class="w-full h-full"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 -960 960 960"
      >
        <path
          d="M80-680v-200h200v80H160v120H80Zm0 600v-200h80v120h120v80H80Zm600
            0v-80h120v-120h80v200H680Zm120-600v-120H680v-80h200v200h-80ZM700-260h60v60h-60v-60Zm0-120h60v60h-60v-60Zm-60
            60h60v60h-60v-60Zm-60 60h60v60h-60v-60Zm-60-60h60v60h-60v-60Zm120-120h60v60h-60v-60Zm-60
            60h60v60h-60v-60Zm-60-60h60v60h-60v-60Zm240-320v240H520v-240h240ZM440-440v240H200v-240h240Zm0-320v240H200v-240h240Zm-60
            500v-120H260v120h120Zm0-320v-120H260v120h120Zm320 0v-120H580v120h120Z"
        />
      </svg>
    </FilledTonalIconButton>
  </div>
  <InputOutline
    id="amount"
    class="bg-background"
    bind:value={amountString}
    bind:valid={amountValid}
    validator={validateAmount}
    inputmode="decimal"
  >
    Amount
    <svelte:fragment slot="supporting text">
      {balance ? `Balance: ${balance.btc}` : ''}
    </svelte:fragment>
  </InputOutline>
  <InputOutline
    id="recipient"
    class="bg-background"
    bind:value={feeString}
    bind:valid={feeValid}
    validator={validateFee}
    inputmode="numeric"
  >
    Fee
    <svelte:fragment slot="supporting text">Satoshi per byte</svelte:fragment>
  </InputOutline>
</form>
