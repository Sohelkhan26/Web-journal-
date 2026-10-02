// Cloudflare Pages Functions Global Middleware
// Enforces security headers, rate limiting, payload size limits, and CORS policies.

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory rate limiting store (scoped per edge worker instance)
const rateLimitMap = new Map<string, RateLimitRecord>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const DEFAULT_MAX_REQUESTS_PER_MINUTE = 60;
const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export const onRequest = async (context: {
  request: Request;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  env: Record<string, unknown>;
}): Promise<Response> => {
  const { request, next } = context;

  // 1. Handle CORS Preflight (OPTIONS)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Sync-Key',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // 2. Client IP extraction for Rate Limiting
  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    '127.0.0.1';

  // 3. Sliding-window Edge Rate Limiting
  const now = Date.now();
  let clientLimit = rateLimitMap.get(clientIp);

  if (!clientLimit || now > clientLimit.resetAt) {
    clientLimit = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitMap.set(clientIp, clientLimit);
  } else {
    clientLimit.count += 1;
  }

  // Clean up stale entries periodically
  if (rateLimitMap.size > 2000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }

  const maxRequests = Number(context.env.RATE_LIMIT_PER_MINUTE) || DEFAULT_MAX_REQUESTS_PER_MINUTE;
  if (clientLimit.count > maxRequests) {
    const retryAfter = Math.ceil((clientLimit.resetAt - now) / 1000);
    return new Response(
      JSON.stringify({
        status: 'error',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please slow down to protect service integrity.',
        retryAfterSeconds: retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(clientLimit.resetAt / 1000)),
        },
      }
    );
  }

  // 4. Request Body Size Guard (Anti-DDoS / Memory exhaustion)
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return new Response(
      JSON.stringify({
        status: 'error',
        code: 'PAYLOAD_TOO_LARGE',
        message: `Request payload exceeds maximum allowed size of ${MAX_PAYLOAD_BYTES / (1024 * 1024)}MB.`,
      }),
      {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 5. Execute downstream handlers with error boundary
  let response: Response;
  try {
    response = await next();
  } catch (err: unknown) {
    console.error('Edge middleware caught error:', err);
    // Prevent internal server error and stack trace leakage
    return new Response(
      JSON.stringify({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An internal error occurred while processing the edge request.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 6. Security Headers on outgoing response
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
