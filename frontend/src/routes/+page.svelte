<script lang="ts">
  import { onMount } from 'svelte';
  import { ChatWidget } from '$lib/components';
  import { chatActions, initChatSocket } from '$lib/stores/chat.store';

  onMount(() => {
    initChatSocket();
    chatActions.loadConversation();
  });
</script>

<div class="chat-container">
  <ChatWidget />
</div>
