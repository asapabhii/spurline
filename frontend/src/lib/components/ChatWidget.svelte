<script lang="ts">
  import MessageList from './MessageList.svelte';
  import ChatInput from './ChatInput.svelte';
  import ChatHeader from './ChatHeader.svelte';
  import ErrorBanner from './ErrorBanner.svelte';
  import Suggestions from './Suggestions.svelte';
  import { error, suggestions, isEmpty } from '$lib/stores/chat.store';
</script>

<div class="chat-widget">
  <ChatHeader />
  
  {#if $error}
    <ErrorBanner message={$error} />
  {/if}
  
  <MessageList />
  
  {#if !$isEmpty && $suggestions.length > 0}
    <Suggestions />
  {/if}
  
  <ChatInput />
</div>

<style>
  .chat-widget {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--color-bg-chat);
    overflow: hidden;
  }
</style>
