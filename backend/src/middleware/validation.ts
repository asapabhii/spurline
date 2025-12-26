import type { NextFunction, Request, Response } from 'express';

import { AppError } from './error-handler.js';

/**
 * Validate that request body is valid JSON
 */
export function validateJsonBody(
  err: Error,
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (err instanceof SyntaxError && 'body' in err) {
    throw new AppError(400, 'Invalid JSON in request body', 'INVALID_JSON');
  }
  next(err);
}

/**
 * Sanitize input to prevent basic injection
 * Note: This is a simple sanitization - production would need more robust handling
 */
export function sanitizeInput(input: string): string {
  // Trim whitespace
  let sanitized = input.trim();
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Limit consecutive whitespace
  sanitized = sanitized.replace(/\s{10,}/g, ' '.repeat(10));
  
  return sanitized;
}

/**
 * Check if message content is valid
 */
export function validateMessageContent(content: string): { 
  isValid: boolean; 
  error?: string; 
} {
  if (!content || content.trim().length === 0) {
    return { 
      error: 'Message cannot be empty. Please type something to send.',
      isValid: false, 
    };
  }

  if (content.length > 2000) {
    return { 
      error: 'Message is too long. Please keep it under 2000 characters.',
      isValid: false, 
    };
  }

  // Check for messages that are just whitespace/special chars
  const meaningfulContent = content.replace(/[\s\n\r\t]/g, '');
  if (meaningfulContent.length === 0) {
    return { 
      error: 'Message must contain some text content.',
      isValid: false, 
    };
  }

  return { isValid: true };
}

