<script lang="ts">
  import { chatActions } from '$lib/stores/chat.store';

  interface Props {
    message: string;
  }

  let { message }: Props = $props();
</script>

<div class="error-banner" role="alert">
  <span>{message}</span>
  <button onclick={() => chatActions.clearError()} aria-label="Dismiss">×</button>
</div>

<style>
  .error-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 16px;
    background: var(--color-error-bg);
    border-bottom: 1px solid var(--color-error);
    color: var(--color-error);
    font-size: 13px;
  }

  span {
    flex: 1;
    line-height: 1.4;
  }

  button {
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: var(--color-error);
    font-size: 18px;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.15s;
  }

  button:hover {
    opacity: 1;
  }
</style>
