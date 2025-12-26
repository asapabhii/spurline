<script lang="ts">
  import MessageList from './MessageList.svelte';
  import ChatInput from './ChatInput.svelte';
  import ChatHeader from './ChatHeader.svelte';
  import ErrorBanner from './ErrorBanner.svelte';
  import { error } from '$lib/stores/chat.store';
</script>

<div class="chat-widget">
  <ChatHeader />
  
  {#if $error}
    <ErrorBanner message={$error} />
  {/if}
  
  <MessageList />
  <ChatInput />
</div>

<style>
  .chat-widget {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--color-bg-chat);
  }
</style>

