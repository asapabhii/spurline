<script lang="ts">
  /**
   * Format date in Indian format: "26 December 2025"
   */
  function formatIndianDate(): string {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    return now.toLocaleDateString('en-IN', options);
  }

  const today = formatIndianDate();
</script>

<div class="date-header">
  <span class="date-text">{today}</span>
</div>

<style>
  .date-header {
    display: flex;
    justify-content: center;
    padding: var(--spacing-xs) var(--spacing-md);
    background: var(--color-bg-tertiary);
    border-bottom: 1px solid var(--color-border);
  }

  .date-text {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
</style>

