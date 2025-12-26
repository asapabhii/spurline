import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import type { ApiErrorResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * Custom application error with HTTP status
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly userMessage: string,
    public readonly errorCode: string = 'INTERNAL_ERROR'
  ) {
    super(userMessage);
    this.name = 'AppError';
  }
}

/**
 * LLM-specific errors
 */
export class LLMError extends AppError {
  constructor(
    statusCode: number,
    userMessage: string,
    errorCode: string,
    public readonly isRetryable: boolean = false
  ) {
    super(statusCode, userMessage, errorCode);
    this.name = 'LLMError';
  }

  static rateLimited(): LLMError {
    return new LLMError(
      503,
      'The agent is currently busy. Please try again in a moment.',
      'LLM_RATE_LIMITED',
      true
    );
  }

  static serviceUnavailable(): LLMError {
    return new LLMError(
      503,
      'The agent is temporarily unavailable. Please try again shortly.',
      'LLM_UNAVAILABLE',
      true
    );
  }

  static timeout(): LLMError {
    return new LLMError(
      504,
      'The response took too long. Please try again with a shorter message.',
      'LLM_TIMEOUT',
      true
    );
  }
}

/**
 * Centralized error handler middleware
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ApiErrorResponse>,
  _next: NextFunction
): void {
  // Log error (without sensitive data)
  logger.error('Request error', {
    error: err.message,
    errorCode: err instanceof AppError ? err.errorCode : 'UNKNOWN',
    stack: process.env['NODE_ENV'] === 'development' ? err.stack : undefined,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const firstError = err.errors[0];
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: firstError?.message ?? 'Invalid request data',
    });
    return;
  }

  // Handle custom app errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.errorCode,
      message: err.userMessage,
    });
    return;
  }

  // Default to 500 for unknown errors
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'Something went wrong. Please try again later.',
  });
}
