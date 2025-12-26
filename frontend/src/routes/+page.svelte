<script lang="ts">
  import { onMount } from 'svelte';
  import ChatWidget from '$lib/components/ChatWidget.svelte';
  import { chatActions, sessionId, initChatSocket } from '$lib/stores/chat.store';

  onMount(() => {
    // Initialize socket connection
    initChatSocket();
    
    // Load existing conversation if session exists
    if ($sessionId) {
      chatActions.loadConversation();
    }
  });
</script>

<main class="app-container">
  <div class="chat-container">
    <ChatWidget />
  </div>
</main>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: var(--spacing-md);
    background: linear-gradient(135deg, var(--color-bg-primary) 0%, #0a0a12 100%);
  }

  .chat-container {
    width: 100%;
    max-width: 480px;
    height: min(750px, calc(100vh - 2rem));
    display: flex;
    flex-direction: column;
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--color-border);
    background: var(--color-bg-secondary);
  }
</style>
