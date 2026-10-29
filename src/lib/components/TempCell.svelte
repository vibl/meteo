<script lang="ts">
  import type { ICellProps } from '@svar-ui/svelte-grid';

  let { row }: ICellProps = $props();

  const temp = $derived(row.temp as number);

  // Background lightness: warm colors darken as temp rises, cold colors darken as temp drops
  const lightness = $derived(temp > 0 ? 100 - temp * 1.5 : 50 + temp * 2);
  const hue = $derived(temp > 0 ? 15 : 200);
  const sat = $derived(temp > 0 ? 100 : 80);
  const bgColor = $derived(`hsl(${hue}, ${sat}%, ${lightness}%)`);

  // Text: always darker and less saturated than background, same hue
  const textSat = $derived(sat * 0.8);
  const textLightness = $derived(lightness * 0.35);
  const textColor = $derived(`hsl(${hue}, ${textSat}%, ${textLightness}%)`);
</script>

<div class="flex h-full items-center pr-2 whitespace-nowrap">
  <span
    class="rounded px-2 py-0.5"
    style:--h={hue}
    style:--s="{sat}%"
    style:--l="{lightness}%"
    style:--text-s="{sat * 0.8}%"
    style:--text-l="{lightness * 0.4}%"
    style:background="hsl(var(--h), var(--s), var(--l))"
    style:color="hsl(var(--h), var(--text-s), var(--text-l))"
  >
    {Math.round(temp)}°C
  </span>
</div>
