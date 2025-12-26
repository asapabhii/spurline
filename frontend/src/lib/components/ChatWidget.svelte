<script lang="ts">
  import MessageList from './MessageList.svelte';
  import ChatInput from './ChatInput.svelte';
  import ChatHeader from './ChatHeader.svelte';
  import ErrorBanner from './ErrorBanner.svelte';
  import Suggestions from './Suggestions.svelte';
  import { error, suggestions, isEmpty, isStreaming, isTyping } from '$lib/stores/chat.store';

  // Show suggestions only when not streaming/typing and we have suggestions
  const showSuggestions = $derived(
    !$isEmpty && !$isStreaming && !$isTyping && $suggestions.length > 0
  );
</script>

<div class="chat-widget">
  <ChatHeader />

  {#if $error}
    <ErrorBanner message={$error} />
  {/if}

  <MessageList />

  {#if showSuggestions}
    <Suggestions />
  {/if}

  <ChatInput />
</div>

<style>
  .chat-widget {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    background: var(--color-bg-chat);
    overflow: hidden;
  }
</style>
