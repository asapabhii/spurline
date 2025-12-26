import { getRedisClient } from '../config/redis.js';
import { logger } from '../utils/logger.js';

/**
 * Typing indicator service using Redis for ephemeral state
 * TTL ensures indicators auto-expire if something goes wrong
 */
export class TypingService {
  private readonly keyPrefix = 'typing:';
  private readonly ttlSeconds = 30; // Auto-expire after 30 seconds

  private getKey(sessionId: string): string {
    return `${this.keyPrefix}${sessionId}`;
  }

  /**
   * Set typing indicator to active
   */
  async setTyping(sessionId: string): Promise<void> {
    try {
      const redis = getRedisClient();
      await redis.set(this.getKey(sessionId), 'true', 'EX', this.ttlSeconds);
    } catch (error) {
      // Log but don't throw - typing indicator is non-critical
      logger.warn('Failed to set typing indicator', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
      });
    }
  }

  /**
   * Clear typing indicator
   */
  async clearTyping(sessionId: string): Promise<void> {
    try {
      const redis = getRedisClient();
      await redis.del(this.getKey(sessionId));
    } catch (error) {
      // Log but don't throw - typing indicator is non-critical
      logger.warn('Failed to clear typing indicator', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
      });
    }
  }

  /**
   * Check if typing indicator is active
   */
  async isTyping(sessionId: string): Promise<boolean> {
    try {
      const redis = getRedisClient();
      const value = await redis.get(this.getKey(sessionId));
      return value === 'true';
    } catch (error) {
      // Log but return false - assume not typing on error
      logger.warn('Failed to check typing indicator', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
      });
      return false;
    }
  }
}

// Singleton instance
export const typingService = new TypingService();

