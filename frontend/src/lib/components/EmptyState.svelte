<script lang="ts">
  // Empty state when no messages
</script>

<div class="empty-state">
  <div class="empty-icon">👋</div>
  <h2 class="empty-title">Welcome to Spurline Agent</h2>
  <p class="empty-description">
    Hi there! I'm here to help you with any questions about our products, 
    shipping, returns, or anything else. How can I assist you today?
  </p>
  
  <div class="quick-actions">
    <p class="quick-label">Quick questions:</p>
    <div class="quick-buttons">
      <button class="quick-btn" onclick={() => window.dispatchEvent(new CustomEvent('quick-message', { detail: 'What are your shipping options?' }))}>
        Shipping info
      </button>
      <button class="quick-btn" onclick={() => window.dispatchEvent(new CustomEvent('quick-message', { detail: 'What is your return policy?' }))}>
        Return policy
      </button>
      <button class="quick-btn" onclick={() => window.dispatchEvent(new CustomEvent('quick-message', { detail: 'What are your support hours?' }))}>
        Support hours
      </button>
    </div>
  </div>
</div>

<style>
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--spacing-xl);
    height: 100%;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: var(--spacing-md);
    animation: wave 2s ease-in-out infinite;
  }

  @keyframes wave {
    0%, 100% {
      transform: rotate(0deg);
    }
    25% {
      transform: rotate(20deg);
    }
    75% {
      transform: rotate(-20deg);
    }
  }

  .empty-title {
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-sm);
  }

  .empty-description {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    max-width: 300px;
    line-height: 1.6;
  }

  .quick-actions {
    margin-top: var(--spacing-xl);
    width: 100%;
  }

  .quick-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-sm);
  }

  .quick-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    justify-content: center;
  }

  .quick-btn {
    padding: var(--spacing-xs) var(--spacing-md);
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    color: var(--color-text-secondary);
    font-size: var(--font-size-xs);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .quick-btn:hover {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: white;
  }
</style>

