<script lang="ts">
  import { useBlocksService } from '$lib/providers/ServicesProvider.svelte'

  export let blockHash: string

  const blockQuery = useBlocksService().get(blockHash)
</script>

{#if $blockQuery.isSuccess}
  {$blockQuery.data.timestamp.toLocaleString()}
{/if}
