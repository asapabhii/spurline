<script lang="ts">
  import { tick } from 'svelte';
  import MessageBubble from './MessageBubble.svelte';
  import TypingIndicator from './TypingIndicator.svelte';
  import EmptyState from './EmptyState.svelte';
  import { messages, isTyping, isEmpty } from '$lib/stores/chat.store';

  let messagesContainer: HTMLDivElement;

  // Auto-scroll to bottom when messages change
  $effect(() => {
    if ($messages.length > 0 || $isTyping) {
      tick().then(() => {
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      });
    }
  });
</script>

<div class="messages-container" bind:this={messagesContainer}>
  {#if $isEmpty && !$isTyping}
    <EmptyState />
  {:else}
    <div class="messages-list">
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
    padding: var(--spacing-md);
    scroll-behavior: smooth;
  }

  .messages-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    min-height: 100%;
  }
</style>

