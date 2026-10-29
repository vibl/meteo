<script lang="ts">
  import type { ICellProps } from '@svar-ui/svelte-grid';

  let { row, column }: ICellProps = $props();

  const dateTime = $derived(row.dateTime as Date);
  const monthFormat = $derived<'long' | 'short'>((column?.width ?? 0) >= 100 ? 'long' : 'short');
  const dateStr = $derived(
    dateTime.toLocaleDateString('fr-FR', { month: monthFormat, day: 'numeric' })
  );
</script>

<div class="flex h-full items-center justify-end px-2 whitespace-nowrap">
  {dateStr}
</div>
