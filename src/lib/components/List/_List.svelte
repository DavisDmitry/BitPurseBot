<script lang="ts">
  import ListItem from './_ListItem.svelte'

  let classes = ''
  export { classes as class }
</script>

<div class="py-2 w-full {classes}">
  <slot {ListItem} />
</div>
