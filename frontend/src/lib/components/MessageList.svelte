<script lang="ts">
  import { tick } from 'svelte';
  import MessageBubble from './MessageBubble.svelte';
  import TypingIndicator from './TypingIndicator.svelte';
  import EmptyState from './EmptyState.svelte';
  import DateBadge from './DateBadge.svelte';
  import { messages, isTyping, isEmpty } from '$lib/stores/chat.store';

  let container: HTMLDivElement;

  // Auto-scroll whenever messages change or typing status changes
  $effect(() => {
    // Subscribe to changes
    const _ = [$messages, $isTyping];

    // Scroll after DOM updates
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

      {#if $isTyping}
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
  }

  .messages-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 100%;
  }
</style>
