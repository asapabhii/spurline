<script lang="ts">
  import { tick } from 'svelte';
  import MessageBubble from './MessageBubble.svelte';
  import TypingIndicator from './TypingIndicator.svelte';
  import EmptyState from './EmptyState.svelte';
  import DateBadge from './DateBadge.svelte';
  import { messages, isTyping, isEmpty, isStreaming } from '$lib/stores/chat.store';

  let container: HTMLDivElement;

  // Auto-scroll on new content
  $effect(() => {
    const _ = [$messages.length, $isTyping, $isStreaming];
    tick().then(() => {
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });
  });
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
    padding: 12px 16px;
  }

  .messages-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
</style>
