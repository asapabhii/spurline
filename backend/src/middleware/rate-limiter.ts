import type { NextFunction, Request, Response } from 'express';

import { AppError } from './error-handler.js';
import { logger } from '../utils/logger.js';

/**
 * In-memory rate limiter per session
 * Production: use Redis for distributed rate limiting
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Configuration
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute per session

/**
 * Clean up expired entries periodically
 * Note: Interval is never cleared (acceptable for demo, use proper cleanup in production)
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}, WINDOW_MS);

/**
 * Rate limiter middleware
 * Limits requests per sessionId or IP
 */
export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  // Use sessionId from body or IP as fallback
  const sessionId = (req.body as { sessionId?: string })?.sessionId;
  const key = sessionId ?? req.ip ?? 'unknown';

  const now = Date.now();
  let entry = store.get(key);

  // Create new entry if none exists or window expired
  if (!entry || entry.resetAt <= now) {
    entry = {
      count: 1,
      resetAt: now + WINDOW_MS,
    };
    store.set(key, entry);
    next();
    return;
  }

  // Increment count
  entry.count++;

  // Check limit
  if (entry.count > MAX_REQUESTS) {
    logger.warn('Rate limit exceeded', {
      key: key.slice(0, 8),
      count: entry.count,
    });

    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    res.set('Retry-After', String(retryAfterSeconds));

    next(new AppError(429, 'Too many requests. Please wait a moment.', 'RATE_LIMITED'));
    return;
  }

  next();
}
