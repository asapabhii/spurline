<script lang="ts">
  import { chatActions, isEmpty } from '$lib/stores/chat.store';
</script>

<header class="chat-header">
  <div class="title">
    <span class="dot"></span>
    <span>Spurline Agent</span>
  </div>
  
  {#if !$isEmpty}
    <button onclick={() => chatActions.newConversation()} aria-label="New chat">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14M5 12h14"/>
      </svg>
    </button>
  {/if}
</header>

<style>
  .chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: var(--color-bg-secondary);
    border-bottom: 1px solid var(--color-border);
  }

  .title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    font-size: 15px;
    color: var(--color-text-primary);
  }

  .dot {
    width: 8px;
    height: 8px;
    background: var(--color-success);
    border-radius: 50%;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.15s;
  }

  button:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }
</style>
