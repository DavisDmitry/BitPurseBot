<script lang="ts">
  import { onDestroy, onMount } from 'svelte'

  import { goto } from '$app/navigation'

  import type { PageData } from './$types'

  export let data: PageData

  const onClickBackButton = () => goto('/wallet')

  onMount(() => {
    Telegram.WebApp.BackButton.onClick(onClickBackButton)
    Telegram.WebApp.BackButton.show()
    Telegram.WebApp.MainButton.hide()
  })
  onDestroy(() => Telegram.WebApp.BackButton.offClick(onClickBackButton))
</script>

<h3 class="text-title-large text-center mt-8">Your recovery phrase</h3>
<div class="grid grid-rows-12 grid-flow-col rounded-xl w-64 my-8 mx-auto">
  {#each data.mnemonic.split(' ') as word, index}
    <div class="w-32">
      <span class="text-on-surface-variant">{index + 1}.</span>
      {word}
    </div>
  {/each}
</div>
