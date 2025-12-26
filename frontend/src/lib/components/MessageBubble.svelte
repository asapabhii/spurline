<script lang="ts">
  import type { Message } from '$lib/types';
  import { chatActions, streamingMessageId } from '$lib/stores/chat.store';

  interface Props {
    message: Message;
  }

  let { message }: Props = $props();

  const isUser = $derived(message.sender === 'user');
  const isStreaming = $derived($streamingMessageId === message.id);
  const showFeedback = $derived(message.sender === 'ai' && message.content && !isStreaming);
  
  function formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  async function handleFeedback(rating: 'up' | 'down') {
    if (message.feedback === rating) {
      await chatActions.removeFeedback(message.id);
    } else {
      await chatActions.submitFeedback(message.id, rating);
    }
  }
</script>

<div class="message-wrapper" class:user={isUser} class:ai={!isUser}>
  <div class="message-bubble" class:streaming={isStreaming}>
    <p class="message-content">{message.content}{#if isStreaming}<span class="cursor">▊</span>{/if}</p>
  </div>
  
  <div class="message-footer">
    <span class="message-time">{formatTime(message.createdAt)}</span>
    
    {#if showFeedback}
      <div class="feedback-buttons">
        <button 
          class="feedback-btn" 
          class:active={message.feedback === 'up'}
          onclick={() => handleFeedback('up')}
          title="Helpful"
        >
          👍
        </button>
        <button 
          class="feedback-btn" 
          class:active={message.feedback === 'down'}
          onclick={() => handleFeedback('down')}
          title="Not helpful"
        >
          👎
        </button>
      </div>
    {/if}
  </div>
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

  .message-bubble.streaming {
    min-height: 40px;
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

  .cursor {
    animation: blink 1s infinite;
    color: var(--color-accent);
  }

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }

  .message-footer {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-xs);
    padding: 0 var(--spacing-xs);
  }

  .message-time {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  .feedback-buttons {
    display: flex;
    gap: 2px;
  }

  .feedback-btn {
    padding: 2px 6px;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    opacity: 0.4;
    font-size: 12px;
    transition: all var(--transition-fast);
  }

  .feedback-btn:hover {
    opacity: 1;
    background: var(--color-bg-tertiary);
  }

  .feedback-btn.active {
    opacity: 1;
    background: var(--color-bg-tertiary);
  }
</style>
