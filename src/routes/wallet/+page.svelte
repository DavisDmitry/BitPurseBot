<script lang="ts">
  import { onMount } from 'svelte'

  import { goto } from '$app/navigation'
  import CommonButton from '$lib/components/FilledTonalCommonButton.svelte'
  import IconButton from '$lib/components/FilledTonalIconButton.svelte'
  import List from '$lib/components/List'
  import { useAddressesService } from '$lib/providers/ServicesProvider.svelte'

  import type { PageData } from './$types'
  import TransactionTime from './TransactionTime.svelte'

  export let data: PageData

  const balance = useAddressesService().getBalance()
  const transactionsQuery = useAddressesService().getTransactions()

  onMount(Telegram.WebApp.BackButton.hide)
  onMount(Telegram.WebApp.MainButton.hide)
</script>

<div class="p-4">
  {#if $balance.isSuccess}
    <span class="text-display-small">{$balance.data.btc} BTC</span>
  {/if}
  <div class="flex flex-row gap-4 mt-[0.625rem]">
    <CommonButton href="/wallet/receive">
      <svg
        slot="icon"
        class="w-full h-full"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 -960 960 960"
      >
        <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
      </svg>
      Receive
    </CommonButton>
    <CommonButton href="/wallet/send">
      <svg
        slot="icon"
        class="w-full h-full"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 -960 960 960"
      >
        <path d="m256-240-56-56 384-384H240v-80h480v480h-80v-344L256-240Z" />
      </svg>
      Send
    </CommonButton>
    <IconButton on:click={() => goto('/mnemonic')}>
      <svg
        class="w-full h-full"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 -960 960 960"
      >
        <path
          d="M120-80v-60h100v-30h-60v-60h60v-30H120v-60h120q17 0 28.5 11.5T280-280v40q0
            17-11.5 28.5T240-200q17 0 28.5 11.5T280-160v40q0 17-11.5
            28.5T240-80H120Zm0-280v-110q0-17 11.5-28.5T160-510h60v-30H120v-60h120q17 0
            28.5 11.5T280-560v70q0 17-11.5
            28.5T240-450h-60v30h100v60H120Zm60-280v-180h-60v-60h120v240h-60Zm180
            440v-80h480v80H360Zm0-240v-80h480v80H360Zm0-240v-80h480v80H360Z"
        />
      </svg>
    </IconButton>
  </div>
</div>

{#if $transactionsQuery.isSuccess && $transactionsQuery.data.length}
  <div class="m-4 pt-4 rounded-xl bg-surface-container-highest text-on-surface">
    <h3 class="mx-4 mb-2 text-title-large">History</h3>

    <List let:ListItem>
      {#each $transactionsQuery.data as tx}
        <!-- svelte-ignore missing-declaration -->
        <ListItem
          class="bg-surface-container-highest"
          on:click={() =>
            Telegram.WebApp.openLink(
              `https://blockstream.info/${data.net === 'main' ? '' : 'testnet/'}tx/${
                tx.txid
              }`
            )}
        >
          <svelte:fragment slot="leading">
            <svg
              class="w-6 h-6"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 -960 960 960"
            >
              {#if tx.type === 'deposit'}
                <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
              {:else}
                <path d="m256-240-56-56 384-384H240v-80h480v480h-80v-344L256-240Z" />
              {/if}
            </svg>
          </svelte:fragment>
          {`${tx.type.charAt(0).toUpperCase()}${tx.type.slice(1)}`}
          <svelte:fragment slot="text">
            {#if tx.confirmed}
              Confirmed
              <TransactionTime blockHash={tx.blockHash} />
            {:else}
              Unconfirmed
            {/if}
          </svelte:fragment>
          <span
            slot="trailing"
            class="text-body-medium"
            class:text-green={tx.type === 'deposit'}
          >
            {tx.type === 'deposit' ? '+' : '-'}{tx.amount.btc}
          </span>
        </ListItem>
        <hr class="w-full h-[0.0625rem] text-outline-variant" />
      {/each}
    </List>
  </div>
{/if}
