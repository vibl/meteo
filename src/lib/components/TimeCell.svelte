<script lang="ts">
  import type { ICellProps } from '@svar-ui/svelte-grid';

  let { row }: ICellProps = $props();

  const dateTime = $derived(row.dateTime as Date);
  const timeStr = $derived(
    dateTime.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  );
  // Use isDaylight from row (computed via sunrise/sunset API), fallback to hardcoded hours
  const isDaytime = $derived(
    row.isDaylight ?? (dateTime.getHours() >= 8 && dateTime.getHours() < 22)
  );
</script>

<div class="flex h-full items-center pr-2 whitespace-nowrap">
  <span
    class="rounded px-2 py-0.5 text-white"
    style:background-color={isDaytime ? 'hsl(40 60% 45%)' : 'hsl(243 40% 40%)'}
  >
    {timeStr}
  </span>
</div>
