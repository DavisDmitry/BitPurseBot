<script lang="ts" context="module">
  import { getContext, setContext } from 'svelte'

  import type { AddressesService } from '$lib/addresses'
  import type { BlocksService } from '$lib/blocks'
  import type { TransactionsService } from '$lib/transactions'

  export function useAddressesService(): AddressesService {
    return getContext('addressesService')
  }

  export function useBlocksService(): BlocksService {
    return getContext('blocksService')
  }

  export function useTransactionsService(): TransactionsService {
    return getContext('transactionsService')
  }
</script>

<script lang="ts">
  export let addressesService: AddressesService
  export let blocksService: BlocksService
  export let transactionsService: TransactionsService

  setContext('addressesService', addressesService)
  setContext('blocksService', blocksService)
  setContext('transactionsService', transactionsService)
</script>

<slot />
