<div class="typing-row">
  <div class="avatar">
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 6h12v2H6V6z" fill="currentColor" />
      <path d="M4 8h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" fill="currentColor" />
      <circle cx="9" cy="14" r="1.5" fill="#2563eb" />
      <circle cx="15" cy="14" r="1.5" fill="#2563eb" />
      <path
        d="M9 17.5c0 0 1.5 1.5 3 1.5s3-1.5 3-1.5"
        stroke="#2563eb"
        stroke-width="1.5"
        stroke-linecap="round"
      />
    </svg>
  </div>

  <div class="typing-content">
    <div class="typing-bubble">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
    <span class="label">Agent is typing...</span>
  </div>
</div>

<style>
  .typing-row {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .avatar {
    width: 32px;
    height: 32px;
    background: #2563eb;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding: 5px;
    color: #fff;
  }

  .avatar svg {
    width: 100%;
    height: 100%;
  }

  .typing-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
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

  .dot:nth-child(1) {
    animation-delay: 0s;
  }
  .dot:nth-child(2) {
    animation-delay: 0.15s;
  }
  .dot:nth-child(3) {
    animation-delay: 0.3s;
  }

  @keyframes bounce {
    0%,
    60%,
    100% {
      transform: translateY(0);
      opacity: 0.5;
    }
    30% {
      transform: translateY(-5px);
      opacity: 1;
    }
  }

  .label {
    font-size: 11px;
    color: var(--color-text-muted);
    padding-left: 4px;
  }
</style>
