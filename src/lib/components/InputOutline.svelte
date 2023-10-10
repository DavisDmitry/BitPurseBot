<script lang="ts">
  export let id: string
  export let value: string | undefined = undefined
  export let inputmode: 'text' | 'decimal' | 'numeric' = 'text'
  export let minlength: number | undefined = undefined
  export let maxlength: number | undefined = undefined
  export let required = false
  export let valid = false
  export let validator: ((value: string) => string | void) | undefined = undefined

  let classes = ''
  export { classes as class }

  let input: HTMLInputElement | undefined
  let validationMessage: string

  $: {
    if (input) input.required = required
  }

  $: {
    if (!value) input?.setCustomValidity('')
    else if (validator) {
      input?.setCustomValidity(validator(value) ?? '')
    }
    valid = input?.validity.valid ?? false
    validationMessage = input?.validationMessage ?? ''
  }
</script>

<div class="flex flex-col mb-5 text-on-surface-variant bg-[inherit] grow {classes}">
  <div class="relative z-0 bg-[inherit]">
    <input
      bind:this={input}
      {id}
      class="w-full h-14 rounded border border-outline bg-[transparent] peer
      text-left text-on-surface text-body-large overflow-x-auto
      focus:border-primary hover:border-on-surface focus:ring-0 focus:outline-none
      invalid:border-error invalid:hover:border-on-error-container
      {$$slots.leading ? 'pl-[52px]' : 'pl-4'}
      {$$slots.trailing ? 'pr-[52px]' : 'pr-4'}"
      placeholder=" "
      {inputmode}
      {minlength}
      {maxlength}
      bind:value
    />
    <label
      for={id}
      class="absolute z-10 px-1 left-3 top-4 text-body-large bg-[inherit]
      transform duration-200 origin-[0]
      {value && value !== '' ? 'scale-75 -translate-y-7' : 'scale-100 translate-y-0'}
      peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0
      peer-focus:scale-75 peer-focus:-translate-y-7
      peer-focus:text-primary peer-hover:text-on-surface
      peer-invalid:text-error peer-invalid:peer-hover:text-on-error-container"
    >
      <slot />
    </label>
    {#if $$slots.leading}
      <div class="absolute z-10 w-6 h-6 left-3 top-4"><slot name="leading" /></div>
    {/if}
    {#if $$slots.trailing}
      <div
        class="absolute z-10 w-6 h-6 right-3 top-4"
        class:text-error={input?.validationMessage}
      >
        <slot name="trailing" />
      </div>
    {/if}
  </div>
  <div
    class="h-4 px-4 mt-1 text-body-small"
    class:invisible={!validationMessage && !$$slots['supporting text']}
    class:text-error={validationMessage}
  >
    {#if validationMessage}
      {validationMessage}
    {:else}
      <slot name="supporting text" />
    {/if}
  </div>
</div>
