<script lang="ts">
  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
</script>

<div class="date-badge">
  <span>{today}</span>
</div>

<style>
  .date-badge {
    display: flex;
    justify-content: center;
    padding: 8px 0;
  }

  .date-badge span {
    font-size: 11px;
    color: var(--color-text-muted);
    background: var(--color-bg-tertiary);
    padding: 4px 12px;
    border-radius: 12px;
  }
</style>

