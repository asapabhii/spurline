<script lang="ts">
  import { chatActions, isStreaming, isTyping } from '$lib/stores/chat.store';

  let inputValue = $state('');
  let textarea: HTMLTextAreaElement;
  let isSending = $state(false);

  const isDisabled = $derived($isStreaming || $isTyping || isSending);
  const canSend = $derived(inputValue.trim().length > 0 && !isDisabled);

  async function handleSubmit() {
    if (!canSend) return;
    
    const message = inputValue.trim();
    inputValue = '';
    resetHeight();
    isSending = true;
    
    try {
      await chatActions.sendMessage(message);
    } finally {
      isSending = false;
      textarea?.focus();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput() {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
    }
  }

  function resetHeight() {
    if (textarea) textarea.style.height = 'auto';
  }
</script>

<form class="input-form" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
  <div class="input-wrapper" class:disabled={isDisabled}>
    <textarea
      bind:this={textarea}
      bind:value={inputValue}
      onkeydown={handleKeydown}
      oninput={handleInput}
      placeholder={isDisabled ? "Waiting for response..." : "Type a message..."}
      disabled={isDisabled}
      rows="1"
      maxlength="2000"
    ></textarea>
    
    <button type="submit" disabled={!canSend} aria-label="Send message">
      {#if isSending}
        <div class="spinner"></div>
      {:else}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
        </svg>
      {/if}
    </button>
  </div>
</form>

<style>
  .input-form {
    padding: 12px 16px 16px;
    background: var(--color-bg-secondary);
    border-top: 1px solid var(--color-border);
  }

  .input-wrapper {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    background: var(--color-bg-tertiary);
    border-radius: 24px;
    padding: 10px 14px;
    border: 1px solid var(--color-border);
    transition: border-color 0.2s, opacity 0.2s;
  }

  .input-wrapper:focus-within {
    border-color: var(--color-accent);
  }

  .input-wrapper.disabled {
    opacity: 0.6;
    pointer-events: none;
  }

  textarea {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--color-text-primary);
    font-family: inherit;
    font-size: 14px;
    line-height: 1.5;
    resize: none;
    max-height: 100px;
    padding: 2px 0;
  }

  textarea::placeholder {
    color: var(--color-text-muted);
  }

  textarea:focus {
    outline: none;
  }

  textarea:disabled {
    cursor: not-allowed;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 50%;
    background: var(--color-accent);
    color: #fff;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  button:hover:not(:disabled) {
    background: var(--color-accent-hover);
    transform: scale(1.05);
  }

  button:disabled {
    background: var(--color-bg-secondary);
    color: var(--color-text-muted);
    cursor: not-allowed;
    transform: none;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
