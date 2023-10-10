<script lang="ts">
  import { AddressApi, BlockApi, TxApi } from '@interlay/esplora-btc-api'
  import { QueryClientProvider } from '@sveltestack/svelte-query'

  import { AddressesService, EsploraAddressesRepository } from '$lib/addresses'
  import { BlocksService, EsploraBlocksRepository } from '$lib/blocks'
  import RepositoriesProvider from '$lib/providers/RepositoriesProvider.svelte'
  import ServicesProvider from '$lib/providers/ServicesProvider.svelte'
  import {
    TransactionsService,
    WrappedEsploraTransactionsRepository
  } from '$lib/transactions'
  import { getEsploraBasePath } from '$lib/utils'

  import type { LayoutData } from './$types'

  export let data: LayoutData

  const basePath = getEsploraBasePath(data.net)
</script>

<QueryClientProvider defaultOptions={{ queries: { staleTime: 120000 } }}>
  <RepositoriesProvider
    addressesRepository={new EsploraAddressesRepository(
      new AddressApi(undefined, basePath)
    )}
    blocksRepository={new EsploraBlocksRepository(new BlockApi(undefined, basePath))}
    transactionsRepository={new WrappedEsploraTransactionsRepository(
      new TxApi(undefined, basePath),
      new TxApi(undefined, '/api')
    )}
  >
    <ServicesProvider
      addressesService={new AddressesService(data.wasmWallet.address)}
      blocksService={new BlocksService()}
      transactionsService={new TransactionsService()}
    >
      <slot />
    </ServicesProvider>
  </RepositoriesProvider>
</QueryClientProvider>
