<script lang="ts">
  import type { Message } from '$lib/types';
  import { streamingMessageId } from '$lib/stores/chat.store';

  interface Props {
    message: Message;
  }

  let { message }: Props = $props();

  const isUser = $derived(message.sender === 'user');
  const isStreaming = $derived($streamingMessageId === message.id);
  
  function formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true,
    });
  }
</script>

<div class="message-row" class:user={isUser}>
  <div class="message-bubble" class:streaming={isStreaming}>
    <span class="content">{message.content}</span>{#if isStreaming}<span class="cursor">|</span>{/if}
  </div>
  <span class="time">{formatTime(message.createdAt)}</span>
</div>

<style>
  .message-row {
    display: flex;
    flex-direction: column;
    max-width: 85%;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .message-row.user {
    align-self: flex-end;
    align-items: flex-end;
  }

  .message-row:not(.user) {
    align-self: flex-start;
    align-items: flex-start;
  }

  .message-bubble {
    padding: 10px 14px;
    border-radius: 18px;
    line-height: 1.5;
    word-wrap: break-word;
    word-break: break-word;
    overflow-wrap: break-word;
    white-space: pre-wrap;
    font-size: 14px;
  }

  .user .message-bubble {
    background: var(--color-user-bubble);
    color: #fff;
    border-bottom-right-radius: 4px;
  }

  .message-row:not(.user) .message-bubble {
    background: var(--color-ai-bubble);
    color: var(--color-text-primary);
    border-bottom-left-radius: 4px;
  }

  .content {
    display: inline;
  }

  .cursor {
    display: inline;
    color: #ffffff;
    font-weight: 600;
    animation: blink 0.6s steps(1) infinite;
    margin-left: 1px;
  }

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }

  .time {
    font-size: 11px;
    color: var(--color-text-muted);
    margin-top: 4px;
    padding: 0 4px;
  }
</style>
