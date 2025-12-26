<script lang="ts">
  import { tick } from 'svelte';
  import MessageBubble from './MessageBubble.svelte';
  import TypingIndicator from './TypingIndicator.svelte';
  import EmptyState from './EmptyState.svelte';
  import DateBadge from './DateBadge.svelte';
  import { messages, isTyping, isEmpty, isStreaming } from '$lib/stores/chat.store';

  let container: HTMLDivElement;
  let lastMessageCount = 0;

  // Smooth auto-scroll on new messages or streaming
  $effect(() => {
    const messageCount = $messages.length;
    const typing = $isTyping;
    const streaming = $isStreaming;
    
    // Only scroll if we have new content
    if (messageCount > lastMessageCount || typing || streaming) {
      lastMessageCount = messageCount;
      tick().then(scrollToBottom);
    }
  });

  function scrollToBottom() {
    if (!container) return;
    
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  }
</script>

<div class="messages-container" bind:this={container}>
  {#if $isEmpty && !$isTyping}
    <EmptyState />
  {:else}
    <div class="messages-list">
      <DateBadge />
      
      {#each $messages as message (message.id)}
        <MessageBubble {message} />
      {/each}
      
      {#if $isTyping && !$isStreaming}
        <TypingIndicator />
      {/if}
    </div>
  {/if}
</div>

<style>
  .messages-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 16px;
    scroll-behavior: smooth;
  }

  .messages-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 100%;
  }
</style>
