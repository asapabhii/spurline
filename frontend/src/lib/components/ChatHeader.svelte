<script lang="ts">
  import { chatActions, isEmpty, isTyping, isStreaming } from '$lib/stores/chat.store';

  const isActive = $derived($isTyping || $isStreaming);
</script>

<header class="header">
  <div class="title">
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
    <div class="info">
      <span class="name">Spurline Agent</span>
      <div class="status">
        <span class="dot" class:active={isActive}></span>
        {#if isActive}
          <span class="label">typing...</span>
        {:else}
          <span class="label">online</span>
        {/if}
      </div>
    </div>
  </div>

  {#if !$isEmpty}
    <button onclick={() => chatActions.newConversation()} aria-label="New conversation">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M12 5v14M5 12h14" />
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

  .avatar {
    width: 38px;
    height: 38px;
    background: #2563eb;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding: 6px;
    color: #fff;
  }

  .avatar svg {
    width: 100%;
    height: 100%;
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

  .status {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .status .dot {
    width: 7px;
    height: 7px;
    background: var(--color-success);
    border-radius: 50%;
  }

  .status .dot.active {
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .status .label {
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
