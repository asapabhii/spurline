<script lang="ts">
  import { chatActions, isEmpty, isTyping, isStreaming } from '$lib/stores/chat.store';

  const isActive = $derived($isTyping || $isStreaming);
</script>

<header class="header">
  <div class="title">
    <span class="status" class:active={isActive}></span>
    <div class="info">
      <span class="name">Spurline Agent</span>
      {#if isActive}
        <span class="activity">typing...</span>
      {:else}
        <span class="activity">online</span>
      {/if}
    </div>
  </div>
  
  {#if !$isEmpty}
    <button onclick={() => chatActions.newConversation()} aria-label="New conversation">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14M5 12h14"/>
      </svg>
    </button>
  {/if}
</header>

<style>
  .header {
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
    gap: 12px;
  }

  .status {
    width: 10px;
    height: 10px;
    background: var(--color-success);
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status.active {
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .name {
    font-weight: 600;
    font-size: 15px;
    color: var(--color-text-primary);
  }

  .activity {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;
  }

  button:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }
</style>
