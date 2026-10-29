<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { Grid } from '@svar-ui/svelte-grid';
  import DatagridTheme from '$lib/components/DatagridTheme.svelte';
  import type { ForecastRow, SunTimes } from '$lib/types';
  import { createForecastColumns, forecastResponsive } from '$lib/columns';

  interface Props {
    rows: ForecastRow[];
    currentRowId?: string | null;
    isLoading?: boolean;
    sunTimes?: SunTimes | null;
  }

  let { rows = [], currentRowId = null, isLoading = false, sunTimes = null }: Props = $props();

  const columns = createForecastColumns();

  // Check if a time is during daylight hours
  function isDaylight(dateTime: Date): boolean {
    if (!sunTimes) return true;
    const hour = dateTime.getHours();
    const minute = dateTime.getMinutes();
    const timeMinutes = hour * 60 + minute;

    const sunriseMinutes = sunTimes.sunrise.getHours() * 60 + sunTimes.sunrise.getMinutes();
    const sunsetMinutes = sunTimes.sunset.getHours() * 60 + sunTimes.sunset.getMinutes();

    return timeMinutes >= sunriseMinutes && timeMinutes < sunsetMinutes;
  }

  // Augment rows with isDaylight for cell components
  const augmentedRows = $derived(
    rows.map((row) => ({
      ...row,
      isDaylight: isDaylight(row.dateTime)
    }))
  );

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

  // Highlight current time row and day/night coloring
  const rowStyle = (row: ForecastRow & { isDaylight?: boolean }) => {
    const classes: string[] = [];

    // Day/night coloring
    if (row.isDaylight !== undefined) {
      classes.push(row.isDaylight ? 'wx-day-row' : 'wx-night-row');
    }

    // Current row takes precedence
    if (row.id === currentRowId) {
      classes.push('wx-current-row');
    }

    return classes.join(' ');
  };
</script>

<div class="flex h-full min-h-0 flex-col">
  {#if isLoading}
    <div
      class="flex h-full items-center justify-center rounded-lg border border-dashed border-border/60 text-sm text-muted-foreground md:min-h-[300px]"
    >
      Loading forecast...
    </div>
  {:else if rows.length === 0}
    <div
      class="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-border/60 text-center text-sm text-muted-foreground md:min-h-[300px]"
    >
      <p class="font-medium text-foreground">No forecast data</p>
      <p class="mt-1 text-muted-foreground">Unable to load forecast. Please try again.</p>
    </div>
  {:else}
    <div class="flex-1 overflow-hidden rounded-lg border border-border/60 bg-card md:min-h-[300px]">
      <DatagridTheme>
        {#key isBelowMd}
          <Grid
            data={augmentedRows}
            {columns}
            responsive={isBelowMd ? forecastResponsive : undefined}
            sizes={{ headerHeight: 44 }}
            autoRowHeight={true}
            {rowStyle}
          />
        {/key}
      </DatagridTheme>
    </div>
  {/if}
</div>

<style>
  :global(.wx-current-row) {
    background: color-mix(in srgb, hsl(351 95% 71%) 30%, transparent) !important;
    outline: 2px solid hsl(351 60% 50%);
    outline-offset: -2px;
  }

  :global(.wx-day-row) {
    background: color-mix(in srgb, hsl(48 96% 64%) 12%, transparent) !important;
  }

  :global(.wx-night-row) {
    background: color-mix(in srgb, hsl(239 84% 67%) 15%, transparent) !important;
  }
</style>
