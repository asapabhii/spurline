<div class="typing-row">
  <div class="typing-bubble">
    <span class="dot"></span>
    <span class="dot"></span>
    <span class="dot"></span>
  </div>
  <span class="label">Agent is typing...</span>
</div>

<style>
  .typing-row {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .typing-bubble {
    background: var(--color-ai-bubble);
    padding: 14px 18px;
    border-radius: 18px;
    border-bottom-left-radius: 4px;
    display: flex;
    gap: 5px;
    align-items: center;
  }

  .dot {
    width: 7px;
    height: 7px;
    background: var(--color-text-muted);
    border-radius: 50%;
    animation: bounce 1.2s infinite ease-in-out;
  }

  .dot:nth-child(1) { animation-delay: 0s; }
  .dot:nth-child(2) { animation-delay: 0.15s; }
  .dot:nth-child(3) { animation-delay: 0.3s; }

  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
    30% { transform: translateY(-5px); opacity: 1; }
  }

  .label {
    font-size: 11px;
    color: var(--color-text-muted);
    padding-left: 4px;
  }
</style>
