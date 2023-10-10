<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  export let href: string | undefined = undefined
  let classes = ''
  export { classes as class }

  const dispatch = createEventDispatcher<{ click: undefined }>()
</script>

<svelte:element
  this={href ? 'a' : 'button'}
  class="relative flex flex-row justify-between w-full pl-4 pr-6 py-2 z-0
    bg-surface text-on-surface text-body-large {classes}
    {$$slots.text ? 'h-[4.5rem]' : 'h-14'}"
  {href}
  role={href ? 'button' : 'link'}
  on:click={() => dispatch('click')}
>
  <div class="flex flex-row gap-4 h-full truncate">
    {#if $$slots.leading}
      <div class="my-auto"><slot name="leading" /></div>
    {/if}
    <div class="flex flex-col my-auto text-left truncate">
      <slot />
      {#if $$slots.text}
        <span class="text-on-surface-variant text-body-medium">
          <slot name="text" />
        </span>
      {/if}
    </div>
  </div>
  {#if $$slots.trailing}
    <div class="w-6 min-w-fit ml-4 my-auto text-on-surface-variant text-label-small">
      <slot name="trailing" />
    </div>
  {/if}
  <div
    class="absolute inset-0 z-10 bg-on-surface
      opacity-0 hover:opacity-[0.08] focus:opacity-[0.12] active:opacity-[0.12]"
  />
</svelte:element>
