<script lang="ts">
  import { chatActions } from '$lib/stores/chat.store';
</script>

<header class="chat-header">
  <div class="header-content">
    <div class="avatar">
      <span class="avatar-icon">💬</span>
    </div>
    <div class="header-text">
      <h1 class="title">Spurline Agent</h1>
      <p class="subtitle">AI-powered assistance</p>
    </div>
  </div>
  
  <button 
    class="new-chat-btn" 
    onclick={() => chatActions.newConversation()}
    title="Start new conversation"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  </button>
</header>

<style>
  .chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md) var(--spacing-lg);
    background: var(--color-bg-secondary);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-full);
    background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-muted) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
  }

  .avatar-icon {
    filter: grayscale(100%) brightness(2);
  }

  .header-text {
    display: flex;
    flex-direction: column;
  }

  .title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-text-primary);
    line-height: 1.2;
  }

  .subtitle {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    margin-top: 2px;
  }

  .new-chat-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: var(--radius-md);
    background: var(--color-bg-tertiary);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .new-chat-btn:hover {
    background: var(--color-accent);
    color: var(--color-text-primary);
  }
</style>

