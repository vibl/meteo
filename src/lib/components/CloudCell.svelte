<script lang="ts">
  import type { ICellProps } from '@svar-ui/svelte-grid';

  let { row }: ICellProps = $props();

  const cloud = $derived(row.cloud as number);
  const color = $derived(`hsl(220 ${100 - cloud * 1.7}% ${70 - cloud / 5}%)`);
</script>

<div class="flex h-full items-center pr-2 whitespace-nowrap">
  <span class="rounded px-2 py-0.5" style:background={color}>
    {cloud}%
  </span>
</div>
