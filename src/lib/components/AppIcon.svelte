<script lang="ts">
  import { appIconMarkup, type AppIconName } from "$lib/icons/appIcons";

  let {
    name,
    size = 16,
    dimmed = false,
  }: {
    name: AppIconName;
    size?: number;
    dimmed?: boolean;
  } = $props();
</script>

<span
  class="app-icon"
  class:app-icon--dimmed={dimmed}
  style:width="{size}px"
  style:height="{size}px"
  aria-hidden="true"
>
  {@html appIconMarkup(name, size)}
</span>

<style>
  .app-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: inherit;
    pointer-events: none;
  }

  .app-icon :global(svg) {
    display: block;
  }

  .app-icon--dimmed {
    opacity: 0.38;
  }
</style>
