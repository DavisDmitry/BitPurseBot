<script lang="ts" context="module">
  import { getContext, setContext } from 'svelte'

  import type { AddressesRepository } from '$lib/addresses'
  import type { BlocksRepository } from '$lib/blocks'
  import type { TransactionsRepository } from '$lib/transactions'

  export function useAddressesRepository(): AddressesRepository {
    return getContext('addressesRepository')
  }

  export function useBlocksRepository(): BlocksRepository {
    return getContext('blocksRepository')
  }

  export function useTransactionsRepository(): TransactionsRepository {
    return getContext('transactionsRepository')
  }
</script>

<script lang="ts">
  export let addressesRepository: AddressesRepository
  export let blocksRepository: BlocksRepository
  export let transactionsRepository: TransactionsRepository

  setContext('addressesRepository', addressesRepository)
  setContext('blocksRepository', blocksRepository)
  setContext('transactionsRepository', transactionsRepository)
</script>

<slot />
