<script lang="ts">
  import { chatActions } from '$lib/stores/chat.store';

  interface Props {
    message: string;
  }

  let { message }: Props = $props();
</script>

<div class="error-banner" role="alert">
  <div class="error-content">
    <svg class="error-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
    <span class="error-message">{message}</span>
  </div>
  <button class="dismiss-btn" onclick={() => chatActions.clearError()} aria-label="Dismiss error">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  </button>
</div>

<style>
  .error-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-sm) var(--spacing-md);
    background: rgba(239, 68, 68, 0.1);
    border-bottom: 1px solid var(--color-error);
    animation: slideDown 0.2s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-100%);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .error-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .error-icon {
    color: var(--color-error);
    flex-shrink: 0;
  }

  .error-message {
    font-size: var(--font-size-sm);
    color: var(--color-error);
  }

  .dismiss-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xs);
    background: transparent;
    border: none;
    color: var(--color-error);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: background var(--transition-fast);
  }

  .dismiss-btn:hover {
    background: rgba(239, 68, 68, 0.2);
  }
</style>

