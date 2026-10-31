import type { Request, Response, NextFunction } from 'express';

/**
 * ============================================================================
 * 1. IN-MEMORY RATE LIMITER
 * ============================================================================
 * Tracks request timestamps per client IP. Enforces a maximum of 10 requests
 * per rolling 60-second window. Kept simple and in-memory with periodic garbage collection.
 */
interface IPRateRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, IPRateRecord>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 60 seconds
const MAX_REQUESTS_PER_MINUTE = 10;

// Periodic cleanup every 5 minutes to remove stale IP entries and avoid memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
    if (record.timestamps.length === 0) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref(); // unref so it won't hold open process tests

/**
 * Checks whether an IP address is allowed to proceed under the rate limit.
 */
export function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip) || { timestamps: [] };

  // Retain only requests that occurred within the past 60 seconds
  const recent = record.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= MAX_REQUESTS_PER_MINUTE) {
    const oldestTimestamp = recent[0];
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - oldestTimestamp);
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  recent.push(now);
  rateLimitStore.set(ip, { timestamps: recent });
  return { allowed: true };
}

/**
 * Express middleware to enforce in-memory rate limiting (10 req/min per IP).
 */
export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  // Com contas ativas, o limite é por USUÁRIO (não dá para burlar trocando o cabeçalho de IP).
  const userId = (req as Request & { userId?: string }).userId;
  const clientIp =
    (userId && `user:${userId}`) ||
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.ip ||
    req.socket.remoteAddress ||
    '127.0.0.1';

  const limitCheck = checkRateLimit(clientIp);

  if (!limitCheck.allowed) {
    res.setHeader('Retry-After', limitCheck.retryAfterSeconds || 60);
    return res.status(429).json({
      error: 'Limite de requisições excedido. Máximo de 10 requisições por minuto.',
      code: 'rate_limited'
    });
  }

  next();
}

/**
 * ============================================================================
 * 2. INPUT SANITIZER
 * ============================================================================
 * Trims strings, collapses repeated whitespace/tabs into single spaces,
 * and caps each string field's length to protect prompt tokens and memory.
 */
export const DEFAULT_MAX_STRING_LENGTH = 2000;

/**
 * Sanitizes a single string value:
 * - Trims leading and trailing whitespace
 * - Collapses consecutive spaces/tabs into a single space
 * - Capping the string length at maxLength (default 2000 characters)
 */
export function sanitizeString(val: string, maxLength = DEFAULT_MAX_STRING_LENGTH): string {
  if (typeof val !== 'string') return '';
  const collapsed = val
    .trim()
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n');
  return collapsed.slice(0, maxLength);
}

/**
 * Recursively sanitizes any input (strings, arrays, or nested objects).
 */
export function sanitizeInput<T>(input: T, maxLength = DEFAULT_MAX_STRING_LENGTH): T {
  if (typeof input === 'string') {
    return sanitizeString(input, maxLength) as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeInput(item, maxLength)) as unknown as T;
  }

  if (input !== null && typeof input === 'object') {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      sanitizedObj[key] = sanitizeInput(value, maxLength);
    }
    return sanitizedObj as T;
  }

  return input;
}

/**
 * ============================================================================
 * 3. USER DATA DELIMITER HELPER
 * ============================================================================
 * Wraps user-supplied content inside explicit XML-like data boundary markers.
 * This instructs the model that the content within the tags is passive data
 * to be read, analyzed, or formatted, and must NEVER be interpreted as
 * system instructions or prompt injection overrides.
 */
export function wrapUserData(content: string, label = 'USER_INPUT'): string {
  const sanitized = sanitizeString(content);
  return `<<<${label}_DATA_START>>>\n${sanitized}\n<<<${label}_DATA_END>>>`;
}
