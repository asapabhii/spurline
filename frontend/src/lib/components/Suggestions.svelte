<script lang="ts">
  import { suggestions, chatActions } from '$lib/stores/chat.store';
</script>

{#if $suggestions.length > 0}
  <div class="suggestions">
    {#each $suggestions as text}
      <button onclick={() => chatActions.sendSuggestion(text)}>
        {text}
      </button>
    {/each}
  </div>
{/if}

<style>
  .suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px 16px;
    background: var(--color-bg-secondary);
    border-top: 1px solid var(--color-border);
  }

  button {
    padding: 8px 14px;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: 18px;
    color: var(--color-text-secondary);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  button:hover {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: #fff;
    transform: translateY(-1px);
  }
</style>
