<script lang="ts">
  import { chatActions, isTyping } from '$lib/stores/chat.store';

  const quickQuestions = ['Shipping info', 'Return policy', 'Track order'];
</script>

<div class="empty">
  <div class="content">
    <div class="avatar">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 6h12v2H6V6z" fill="currentColor" />
        <path d="M4 8h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" fill="currentColor" />
        <circle cx="9" cy="14" r="1.5" fill="#2563eb" />
        <circle cx="15" cy="14" r="1.5" fill="#2563eb" />
        <path
          d="M9 17.5c0 0 1.5 1.5 3 1.5s3-1.5 3-1.5"
          stroke="#2563eb"
          stroke-width="1.5"
          stroke-linecap="round"
        />
      </svg>
    </div>
    <h2>Spurline Agent</h2>
    <p>How can I help you today?</p>

    <div class="quick-actions">
      {#each quickQuestions as question}
        <button onclick={() => chatActions.sendSuggestion(question)} disabled={$isTyping}>
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
    width: 64px;
    height: 64px;
    background: #2563eb;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    color: #fff;
    margin-bottom: 16px;
  }

  .avatar svg {
    width: 100%;
    height: 100%;
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
