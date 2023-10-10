<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  export let href: string | undefined = undefined

  let className = ''
  export { className as class }

  const dispatch = createEventDispatcher<{ click: undefined }>()
</script>

<svelte:element
  this={href ? 'a' : 'button'}
  class="relative z-0 flex justify-center items-center h-10 min-w-fit w-10 pr-6 gap-2
    rounded-full text-label-large text-on-secondary-container bg-secondary-container
    {className} {$$slots.icon ? 'pl-4' : 'pl-6'}"
  {href}
  role={href ? 'link' : 'button'}
  on:click={() => dispatch('click')}
>
  <div class="w-[1.125rem] h-[1.125rem]" class:hidden={!$$slots.icon}>
    <slot name="icon" />
  </div>
  <slot />
  <div
    class="absolute z-10 inset-0 rounded-[inherit]
      hover:bg-on-secondary-container hover:opacity-[0.08]
      focus:bg-on-secondary-container focus:opacity-[0.12]
      active:bg-on-secondary-container active:opacity-[0.12]"
  />
</svelte:element>
