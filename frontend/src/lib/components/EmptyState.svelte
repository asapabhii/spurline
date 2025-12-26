<script lang="ts">
  import { chatActions, isTyping } from '$lib/stores/chat.store';

  const questions = [
    'Shipping options',
    'Return policy',
    'Track order',
  ];
</script>

<div class="empty">
  <div class="icon">💬</div>
  <h2>Spurline Agent</h2>
  <p>How can I help you today?</p>
  
  <div class="quick">
    {#each questions as q}
      <button onclick={() => chatActions.sendSuggestion(q)} disabled={$isTyping}>
        {q}
      </button>
    {/each}
  </div>
</div>

<style>
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 40px 20px;
    height: 100%;
  }

  .icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 8px;
  }

  p {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin: 0 0 24px;
  }

  .quick {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }

  .quick button {
    padding: 8px 16px;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: 20px;
    color: var(--color-text-secondary);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .quick button:hover:not(:disabled) {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: #fff;
  }

  .quick button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
