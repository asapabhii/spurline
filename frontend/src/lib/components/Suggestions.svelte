<script lang="ts">
  import { suggestions, chatActions, isTyping } from '$lib/stores/chat.store';

  async function handleSuggestionClick(suggestion: string) {
    await chatActions.sendSuggestion(suggestion);
  }
</script>

<div class="suggestions-container">
  <p class="suggestions-label">Suggested questions:</p>
  <div class="suggestions-list">
    {#each $suggestions as suggestion}
      <button 
        class="suggestion-btn"
        onclick={() => handleSuggestionClick(suggestion)}
        disabled={$isTyping}
      >
        {suggestion}
      </button>
    {/each}
  </div>
</div>

<style>
  .suggestions-container {
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-secondary);
    border-top: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .suggestions-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-xs);
  }

  .suggestions-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }

  .suggestion-btn {
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    color: var(--color-text-secondary);
    font-size: var(--font-size-xs);
    cursor: pointer;
    transition: all var(--transition-fast);
    text-align: left;
  }

  .suggestion-btn:hover:not(:disabled) {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: white;
  }

  .suggestion-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>

