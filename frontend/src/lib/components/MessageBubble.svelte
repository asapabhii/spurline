<script lang="ts">
  import type { Message } from '$lib/types';

  interface Props {
    message: Message;
  }

  let { message }: Props = $props();

  const isUser = $derived(message.sender === 'user');
  const hasContent = $derived(message.content.length > 0);

  function formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
</script>

{#if hasContent}
  <div class="message-row" class:user={isUser}>
    {#if !isUser}
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
    {/if}

    <div class="message-content">
      <div class="bubble">
        <span class="text">{message.content}</span>
      </div>
      <span class="time">{formatTime(message.createdAt)}</span>
    </div>
  </div>
{/if}

<style>
  .message-row {
    display: flex;
    gap: 10px;
    max-width: 85%;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
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
    background: #2563eb;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding: 5px;
    color: #fff;
  }

  .avatar svg {
    width: 100%;
    height: 100%;
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
