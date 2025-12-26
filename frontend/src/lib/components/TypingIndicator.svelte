<script lang="ts">
  // Typing indicator with animated dots
</script>

<div class="typing-wrapper">
  <div class="typing-bubble">
    <div class="typing-dots">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  </div>
</div>

<style>
  .typing-wrapper {
    display: flex;
    align-self: flex-start;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .typing-bubble {
    background: var(--color-ai-bubble);
    padding: var(--spacing-md);
    border-radius: var(--radius-lg);
    border-bottom-left-radius: var(--radius-sm);
  }

  .typing-dots {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .dot {
    width: 8px;
    height: 8px;
    background: var(--color-text-muted);
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out both;
  }

  .dot:nth-child(1) {
    animation-delay: -0.32s;
  }

  .dot:nth-child(2) {
    animation-delay: -0.16s;
  }

  .dot:nth-child(3) {
    animation-delay: 0s;
  }

  @keyframes bounce {
    0%, 80%, 100% {
      transform: scale(0.8);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>

