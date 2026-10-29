<script lang="ts">
  import '../app.css';

  let { children } = $props();
</script>

<!-- Full-viewport flex column: the page below relies on `h-full` for its grids. -->
<div class="flex h-screen min-w-0 flex-col overflow-hidden">
  {@render children()}
</div>
