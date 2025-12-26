<script lang="ts">
  import type { Message } from '$lib/types';

  interface Props {
    message: Message;
  }

  let { message }: Props = $props();

  const isUser = $derived(message.sender === 'user');
  
  function formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="message-wrapper" class:user={isUser} class:ai={!isUser}>
  <div class="message-bubble">
    <p class="message-content">{message.content}</p>
  </div>
  <span class="message-time">{formatTime(message.createdAt)}</span>
</div>

<style>
  .message-wrapper {
    display: flex;
    flex-direction: column;
    max-width: 85%;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .message-wrapper.user {
    align-self: flex-end;
    align-items: flex-end;
  }

  .message-wrapper.ai {
    align-self: flex-start;
    align-items: flex-start;
  }

  .message-bubble {
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-lg);
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .user .message-bubble {
    background: var(--color-user-bubble);
    color: white;
    border-bottom-right-radius: var(--radius-sm);
  }

  .ai .message-bubble {
    background: var(--color-ai-bubble);
    color: var(--color-text-primary);
    border-bottom-left-radius: var(--radius-sm);
  }

  .message-content {
    font-size: var(--font-size-sm);
    line-height: 1.5;
    white-space: pre-wrap;
  }

  .message-time {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin-top: var(--spacing-xs);
    padding: 0 var(--spacing-xs);
  }
</style>

