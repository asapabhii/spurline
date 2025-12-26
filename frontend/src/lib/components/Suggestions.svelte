<script lang="ts">
  import { suggestions, chatActions, isStreaming, isTyping } from '$lib/stores/chat.store';

  const isDisabled = $derived($isStreaming || $isTyping);
</script>

{#if $suggestions.length > 0}
  <div class="suggestions">
    {#each $suggestions as text}
      <button 
        class="suggestion-chip"
        onclick={() => chatActions.sendSuggestion(text)}
        disabled={isDisabled}
      >
        {text}
      </button>
    {/each}
  </div>
{/if}

<style>
  .suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 8px 16px;
    background: var(--color-bg-secondary);
    border-top: 1px solid var(--color-border);
  }

  .suggestion-chip {
    padding: 6px 12px;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    color: var(--color-text-secondary);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .suggestion-chip:hover:not(:disabled) {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: #fff;
  }

  .suggestion-chip:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
