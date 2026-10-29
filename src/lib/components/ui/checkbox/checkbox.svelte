<script lang="ts" module>
  import { Checkbox as CheckboxPrimitive } from 'bits-ui';
  import { cn, type WithElementRef } from '$lib/utils.js';

  export type CheckboxProps = WithElementRef<CheckboxPrimitive.RootProps>;
</script>

<script lang="ts">
  import { Check } from '@lucide/svelte';

  let {
    ref = $bindable(null),
    class: className,
    checked = $bindable(false),
    ...restProps
  }: CheckboxProps = $props();
</script>

<CheckboxPrimitive.Root
  bind:ref
  bind:checked
  class={cn(
    'peer box-border inline-flex size-4 shrink-0 items-center justify-center rounded-sm border border-primary shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
    className
  )}
  {...restProps}
>
  {#snippet children({ checked })}
    {#if checked}
      <Check class="size-3.5" />
    {/if}
  {/snippet}
</CheckboxPrimitive.Root>
