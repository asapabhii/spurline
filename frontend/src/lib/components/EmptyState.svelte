<script lang="ts">
  import { chatActions, isTyping } from '$lib/stores/chat.store';

  const quickQuestions = [
    'Shipping info',
    'Return policy',
    'Track order',
  ];
</script>

<div class="empty">
  <div class="content">
    <div class="avatar">💬</div>
    <h2>Spurline Agent</h2>
    <p>How can I help you today?</p>
    
    <div class="quick-actions">
      {#each quickQuestions as question}
        <button 
          onclick={() => chatActions.sendSuggestion(question)} 
          disabled={$isTyping}
        >
          {question}
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 24px;
  }

  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .avatar {
    font-size: 56px;
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
    margin: 0 0 28px;
  }

  .quick-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }

  .quick-actions button {
    padding: 10px 18px;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: 20px;
    color: var(--color-text-secondary);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .quick-actions button:hover:not(:disabled) {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: #fff;
  }

  .quick-actions button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
