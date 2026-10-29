<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { Grid } from '@svar-ui/svelte-grid';
  import DatagridTheme from '$lib/components/DatagridTheme.svelte';
  import type { RainRow } from '$lib/types';
  import { createRainColumns, rainResponsive } from '$lib/columns';

  interface Props {
    rows: RainRow[];
    isLoading?: boolean;
  }

  let { rows = [], isLoading = false }: Props = $props();

  const columns = createRainColumns();

  // The responsive column config is only meaningful below md, where the panel
  // fills its container. On desktop the wrapper is content-sized, which would
  // close a layout feedback loop with SVAR's width-based responsive observer.
  let isBelowMd = $state(browser ? window.matchMedia('(max-width: 767px)').matches : false);
  onMount(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    isBelowMd = mq.matches;
    const listener = (e: MediaQueryListEvent) => {
      isBelowMd = e.matches;
    };
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  });
</script>

<div class="flex h-full min-h-0 flex-col">
  {#if isLoading}
    <div
      class="flex h-full items-center justify-center rounded-lg border border-dashed border-border/60 text-sm text-muted-foreground md:min-h-[200px]"
    >
      Loading rain nowcast...
    </div>
  {:else if rows.length === 0}
    <div
      class="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-border/60 text-center text-sm text-muted-foreground md:min-h-[200px]"
    >
      <p class="font-medium text-foreground">No rain data</p>
      <p class="mt-1 text-muted-foreground">Unable to load rain nowcast.</p>
    </div>
  {:else if isBelowMd}
    {@const half = Math.ceil(rows.length / 2)}
    <div class="grid min-h-0 flex-1 grid-cols-2 gap-2">
      <div class="overflow-hidden rounded-lg border border-border/60 bg-card">
        <DatagridTheme>
          <Grid
            data={rows.slice(0, half)}
            {columns}
            responsive={rainResponsive}
            sizes={{ headerHeight: 44 }}
            autoRowHeight={true}
          />
        </DatagridTheme>
      </div>
      <div class="overflow-hidden rounded-lg border border-border/60 bg-card">
        <DatagridTheme>
          <Grid
            data={rows.slice(half)}
            {columns}
            responsive={rainResponsive}
            sizes={{ headerHeight: 44 }}
            autoRowHeight={true}
          />
        </DatagridTheme>
      </div>
    </div>
  {:else}
    <div class="flex-1 overflow-hidden rounded-lg border border-border/60 bg-card md:min-h-[200px]">
      <DatagridTheme>
        <Grid data={rows} {columns} sizes={{ headerHeight: 44 }} autoRowHeight={true} />
      </DatagridTheme>
    </div>
  {/if}
</div>
