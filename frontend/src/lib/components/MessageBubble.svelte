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
  {#if !isUser}
    <div class="avatar">S</div>
  {/if}
  
  <div class="message-content">
    <div class="bubble">
      <span class="text">{message.content}</span>
    </div>
    <span class="time">{formatTime(message.createdAt)}</span>
  </div>
</div>

<style>
  .message-row {
    display: flex;
    gap: 10px;
    max-width: 85%;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .message-row.user {
    align-self: flex-end;
    flex-direction: row-reverse;
  }

  .message-row:not(.user) {
    align-self: flex-start;
  }

  .avatar {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, var(--color-accent) 0%, #7c3aed 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    flex-shrink: 0;
  }

  .message-content {
    display: flex;
    flex-direction: column;
  }

  .user .message-content {
    align-items: flex-end;
  }

  .message-row:not(.user) .message-content {
    align-items: flex-start;
  }

  .bubble {
    padding: 12px 16px;
    border-radius: 18px;
    line-height: 1.5;
    word-wrap: break-word;
    word-break: break-word;
    overflow-wrap: break-word;
    white-space: pre-wrap;
    font-size: 14px;
  }

  .user .bubble {
    background: var(--color-user-bubble);
    color: #fff;
    border-bottom-right-radius: 4px;
  }

  .message-row:not(.user) .bubble {
    background: var(--color-ai-bubble);
    color: var(--color-text-primary);
    border-bottom-left-radius: 4px;
  }

  .text {
    display: inline;
  }

  .time {
    font-size: 11px;
    color: var(--color-text-muted);
    margin-top: 4px;
    padding: 0 4px;
  }
</style>
