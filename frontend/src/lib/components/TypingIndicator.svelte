<div class="typing">
  <div class="dots">
    <span></span>
    <span></span>
    <span></span>
  </div>
</div>

<style>
  .typing {
    display: flex;
    align-items: flex-start;
    max-width: 80%;
  }

  .dots {
    background: var(--color-ai-bubble);
    padding: 12px 16px;
    border-radius: 16px;
    border-bottom-left-radius: 4px;
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .dots span {
    width: 6px;
    height: 6px;
    background: var(--color-text-muted);
    border-radius: 50%;
    animation: bounce 1.2s infinite ease-in-out;
  }

  .dots span:nth-child(1) { animation-delay: 0s; }
  .dots span:nth-child(2) { animation-delay: 0.15s; }
  .dots span:nth-child(3) { animation-delay: 0.3s; }

  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
    30% { transform: translateY(-4px); opacity: 1; }
  }
</style>
