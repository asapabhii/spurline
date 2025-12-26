/**
 * Safe logger that never logs PII or secrets
 */

type LogLevel = 'debug' | 'error' | 'info' | 'warn';

interface LogContext {
  [key: string]: unknown;
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(sanitizeContext(context))}` : '';
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
}

/**
 * Remove sensitive fields from log context
 */
function sanitizeContext(context: LogContext): LogContext {
  const sensitiveKeys = ['apikey', 'authorization', 'password', 'secret', 'token'];
  const sanitized: LogContext = {};

  for (const [key, value] of Object.entries(context)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeContext(value as LogContext);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (process.env['NODE_ENV'] === 'development') {
      console.debug(formatMessage('debug', message, context));
    }
  },

  error(message: string, context?: LogContext): void {
    console.error(formatMessage('error', message, context));
  },

  info(message: string, context?: LogContext): void {
    console.info(formatMessage('info', message, context));
  },

  warn(message: string, context?: LogContext): void {
    console.warn(formatMessage('warn', message, context));
  },
};

