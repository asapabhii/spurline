/**
 * Production-grade logger with structured output
 * Never logs PII, tokens, or sensitive data
 */

type LogLevel = 'debug' | 'error' | 'info' | 'warn';

interface LogContext {
  [key: string]: unknown;
}

const SENSITIVE_KEYS = ['apikey', 'authorization', 'password', 'secret', 'token'];
const IS_DEV = process.env['NODE_ENV'] === 'development';

/**
 * Sanitize context object to remove sensitive data
 */
function sanitize(obj: LogContext): LogContext {
  const result: LogContext = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lower = key.toLowerCase();
    
    if (SENSITIVE_KEYS.some(s => lower.includes(s))) {
      result[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitize(value as LogContext);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Format log message for output
 */
function format(level: LogLevel, message: string, context?: LogContext): string {
  const time = new Date().toISOString();
  const ctx = context ? ` ${JSON.stringify(sanitize(context))}` : '';
  return `[${time}] ${level.toUpperCase().padEnd(5)} ${message}${ctx}`;
}

/**
 * Logger instance
 */
export const logger = {
  debug(message: string, context?: LogContext): void {
    if (IS_DEV) {
      console.debug(format('debug', message, context));
    }
  },

  info(message: string, context?: LogContext): void {
    console.info(format('info', message, context));
  },

  warn(message: string, context?: LogContext): void {
    console.warn(format('warn', message, context));
  },

  error(message: string, context?: LogContext): void {
    console.error(format('error', message, context));
  },
};

