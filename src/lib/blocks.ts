import type { BlockApi } from '@interlay/esplora-btc-api'
import { useQuery, useQueryClient } from '@sveltestack/svelte-query'

import { useBlocksRepository } from './providers/RepositoriesProvider.svelte'

export interface Block {
  id: string
  timestamp: Date
}

export interface BlocksRepository {
  get(id: string): Promise<Block>
}

export class EsploraBlocksRepository implements BlocksRepository {
  constructor(protected readonly api: BlockApi) {}

  async get(hash: string) {
    const { id, timestamp } = (await this.api.getBlock(hash)).data
    return { id, timestamp: new Date(timestamp * 1000) }
  }
}

export class BlocksService {
  protected readonly repository
  protected readonly queryClient

  constructor() {
    this.repository = useBlocksRepository()
    this.queryClient = useQueryClient()
  }

  get(id: string) {
    return useQuery(['blocks', id], () => this.repository.get(id), {
      staleTime: Infinity
    })
  }
}
