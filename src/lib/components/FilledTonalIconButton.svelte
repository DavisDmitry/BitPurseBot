<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  let className = ''
  export { className as class }

  const dispatch = createEventDispatcher<{ click: undefined }>()
</script>

<button
  class="relative z-0 h-10 w-10 bg-secondary-container rounded-full
    text-on-secondary-container {className}"
  on:click={() => dispatch('click')}
>
  <div class="w-[1.125rem] h-[1.125rem] m-auto">
    <slot />
  </div>
  <div
    class="absolute z-10 inset-0 rounded-[inherit] bg-on-secondary-container
      opacity-0 hover:opacity-[0.08] focus:opacity-[0.12] active:opacity-[0.12]"
  />
</button>
