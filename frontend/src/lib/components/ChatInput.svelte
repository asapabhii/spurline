<script lang="ts">
  import { chatActions, isLoading, isTyping, streamingMessageId } from '$lib/stores/chat.store';

  let inputValue = $state('');
  let inputElement: HTMLTextAreaElement;

  const isDisabled = $derived($isLoading || $isTyping || $streamingMessageId !== null);
  const canSend = $derived(inputValue.trim().length > 0 && !isDisabled);
  const charCount = $derived(inputValue.length);
  const maxChars = 2000;

  async function handleSubmit() {
    if (!canSend) return;
    
    const message = inputValue.trim();
    inputValue = '';
    
    // Reset textarea height
    if (inputElement) {
      inputElement.style.height = 'auto';
    }
    
    await chatActions.sendMessage(message);
    
    // Focus back on input after sending
    if (inputElement) {
      inputElement.focus();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  function handleInput() {
    // Auto-resize textarea
    if (inputElement) {
      inputElement.style.height = 'auto';
      inputElement.style.height = Math.min(inputElement.scrollHeight, 120) + 'px';
    }
  }
</script>

<form class="chat-input-form" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
  <div class="input-container" class:disabled={isDisabled}>
    <textarea
      bind:this={inputElement}
      bind:value={inputValue}
      onkeydown={handleKeydown}
      oninput={handleInput}
      placeholder={isDisabled ? "Waiting for response..." : "Type your message..."}
      disabled={isDisabled}
      rows="1"
      class="message-input"
      maxlength={maxChars}
    ></textarea>
    
    <button 
      type="submit" 
      class="send-button"
      disabled={!canSend}
      aria-label="Send message"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 2L11 13" />
        <path d="M22 2L15 22L11 13L2 9L22 2Z" />
      </svg>
    </button>
  </div>
  
  <div class="input-footer">
    <span class="input-hint">Enter to send • Shift+Enter for new line</span>
    {#if charCount > maxChars * 0.8}
      <span class="char-count" class:warning={charCount > maxChars * 0.9}>
        {charCount}/{maxChars}
      </span>
    {/if}
  </div>
</form>

<style>
  .chat-input-form {
    padding: var(--spacing-md);
    background: var(--color-bg-secondary);
    border-top: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .input-container {
    display: flex;
    align-items: flex-end;
    gap: var(--spacing-sm);
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-lg);
    padding: var(--spacing-sm);
    border: 1px solid var(--color-border);
    transition: border-color var(--transition-fast);
  }

  .input-container:focus-within {
    border-color: var(--color-border-focus);
  }

  .input-container.disabled {
    opacity: 0.7;
  }

  .message-input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--color-text-primary);
    font-family: var(--font-family);
    font-size: var(--font-size-sm);
    line-height: 1.5;
    padding: var(--spacing-xs) var(--spacing-sm);
    resize: none;
    max-height: 120px;
    min-height: 24px;
  }

  .message-input::placeholder {
    color: var(--color-text-muted);
  }

  .message-input:focus {
    outline: none;
  }

  .message-input:disabled {
    cursor: not-allowed;
  }

  .send-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: var(--radius-md);
    background: var(--color-accent);
    color: white;
    cursor: pointer;
    transition: all var(--transition-fast);
    flex-shrink: 0;
  }

  .send-button:hover:not(:disabled) {
    background: var(--color-accent-hover);
    transform: scale(1.05);
  }

  .send-button:disabled {
    background: var(--color-bg-secondary);
    color: var(--color-text-muted);
    cursor: not-allowed;
  }

  .input-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: var(--spacing-xs);
    padding: 0 var(--spacing-xs);
  }

  .input-hint {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  .char-count {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  .char-count.warning {
    color: var(--color-error);
  }
</style>
