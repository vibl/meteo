<script lang="ts">
  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';

  // Theme context for SVAR components
  const theme = writable('datagrid');
  setContext('svar-theme', theme);

  let { children } = $props();
</script>

<!-- display: contents makes the div invisible to layout while preserving CSS cascade -->
<div class="wx-datagrid-theme" style="display: contents">
  {@render children()}
</div>

<style>
  /*
   * CRITICAL: Do NOT add display:flex, height:100%, or flex:1 to the wrapper.
   * These break SVAR Grid's virtualization by causing incorrect clientHeight.
   * The parent component must provide explicit height constraints.
   */

  :global(.wx-datagrid-theme) {
    /* Focus states */
    --wx-color-focus: var(--wx-color-primary);
    --wx-color-focus-ring: color-mix(in srgb, var(--wx-color-primary) 30%, transparent);

    /* Grid specific variables */
    --wx-grid-header-background: var(--wx-color-surface);
    --wx-grid-header-font-color: var(--wx-color-font);
    --wx-grid-header-border: var(--wx-color-border);
    --wx-grid-body-background: var(--wx-color-background);
    --wx-grid-body-font-color: var(--wx-color-font);
    --wx-grid-body-row-border: var(--wx-color-border);
    --wx-grid-body-row-hover: var(--wx-color-background-light);
    --wx-grid-body-row-selected: color-mix(in srgb, var(--wx-color-primary) 12.5%, transparent);
    --wx-grid-cell-border: 1px solid transparent;
    --wx-grid-cell-min-height: 64px;

    /* Table specific variables */
    --wx-table-select-background: color-mix(in srgb, var(--wx-color-primary) 12.5%, transparent);
    --wx-table-select-focus-background: color-mix(
      in srgb,
      var(--wx-color-primary) 18.8%,
      transparent
    );
    --wx-table-select-color: var(--wx-color-font);
    --wx-table-border: 1px solid var(--wx-color-border);
    --wx-table-select-border: inset 3px 0 var(--wx-color-primary);
    --wx-table-header-border: var(--wx-table-border);
    --wx-table-header-cell-border: var(--wx-table-border);
    --wx-table-footer-cell-border: var(--wx-table-border);
    --wx-table-cell-border: var(--wx-table-border);
    --wx-header-font-weight: 600;
  }

  /* Ensure Grid fills available height and width */
  :global(.wx-datagrid-theme .wx-grid) {
    flex: 1;
    min-height: 0;
    width: 100%;
  }

  /* Ensure table box fills container width */
  :global(.wx-datagrid-theme .wx-table-box) {
    width: 100%;
  }

  /* Ensure proper contrast and readability */
  :global(.wx-datagrid-theme *) {
    color-scheme: dark;
  }

  /* Prevent text wrapping in grid cells */
  :global(.wx-datagrid-theme .wx-cell) {
    white-space: nowrap;
  }

  /* When rows auto-grow, svar defaults to `word-break: break-all`, which
     splits mid-word. Force word-boundary wrapping everywhere instead. */
  :global(.wx-datagrid-theme .wx-row.wx-autoheight .wx-cell) {
    word-break: normal !important;
    overflow-wrap: break-word !important;
  }

  /* Ensure header stays above scrolling content */
  :global(.wx-datagrid-theme .wx-header) {
    position: relative;
    z-index: 1;
    background: var(--wx-grid-header-background);
  }
</style>
