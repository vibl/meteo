<script lang="ts">
  import type { ICellProps } from '@svar-ui/svelte-grid';

  let { row }: ICellProps = $props();

  // Beyond the hourly horizon MF gives no rain_1h; show a blank cell, not "null".
  const rain = $derived(row.rain as number | null);
  const color = $derived(
    rain === null || rain === 0 ? 'transparent' : `hsl(180 ${rain * 20 + 10}% ${70 - rain * 6}%)`
  );
  const fontColor = $derived(
    rain === null || rain === 0 ? 'inherit' : `hsl(180 80% ${(70 - rain * 6) * 0.4}%)`
  );
</script>

<div class="flex h-full items-center px-2 whitespace-nowrap">
  <span class="rounded px-2 py-0.5" style:background={color} style:color={fontColor}>
    {rain ?? ''}
  </span>
</div>
