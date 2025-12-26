<script lang="ts">
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
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
    padding: 8px 0 12px;
  }

  .date-badge span {
    font-size: 11px;
    color: var(--color-text-muted);
    background: var(--color-bg-tertiary);
    padding: 5px 14px;
    border-radius: 12px;
    letter-spacing: 0.2px;
  }
</style>
