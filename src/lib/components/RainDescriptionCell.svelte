<script lang="ts">
  import type { ICellProps } from '@svar-ui/svelte-grid';

  let { row }: ICellProps = $props();

  const intensity = $derived(row.rain_intensity as number);
  const description = $derived(row.description as string);
  const saturation = $derived(intensity * 20 - 20);
  const lightness = $derived(80 - intensity * 10);
  const bgColor = $derived(
    intensity === 0 ? 'transparent' : `hsl(180 ${saturation}% ${lightness}%)`
  );
  const fontColor = $derived(
    intensity === 0 ? 'inherit' : `hsl(180 ${saturation * 0.8}% ${lightness * 0.4}%)`
  );
</script>

<div class="flex h-full items-center px-1 whitespace-nowrap">
  <span class="rounded px-1.5 py-0.5" style:background={bgColor} style:color={fontColor}>
    {description}
  </span>
</div>
