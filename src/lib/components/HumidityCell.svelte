<script lang="ts">
  import type { ICellProps } from '@svar-ui/svelte-grid';

  let { row }: ICellProps = $props();

  const humidity = $derived(row.humidity as number);
  const bgLightness = $derived(110 - humidity);
  const color = $derived(`hsl(80 40% ${bgLightness}%)`);
  const textLightness = $derived(humidity <= 80 ? bgLightness * 0.4 : bgLightness * 1.4);
  const textColor = $derived(`hsl(80 55% ${textLightness}%)`);
</script>

<div class="flex h-full items-center pr-2 whitespace-nowrap">
  <span class="rounded px-2 py-0.5" style:background={color} style:color={textColor}>
    {humidity}%
  </span>
</div>
