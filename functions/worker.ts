// Cloudflare Worker Entry Point for web-journal
// Unifies static assets and serverless /api/sync edge routes with rate limiting and security headers.

import { onRequestGet, onRequestPost } from './api/sync';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const DEFAULT_MAX_REQUESTS_PER_MINUTE = 60;
const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

interface Env {
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
  DB?: {
    prepare: (query: string) => {
      bind: (...args: unknown[]) => {
        all: <T = unknown>() => Promise<{ results: T[] }>;
        run: () => Promise<{ success: boolean }>;
      };
    };
  };
  SYNC_SECRET?: string;
  RATE_LIMIT_PER_MINUTE?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // If request is for an API route, process it with security middleware
    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env, url);
    }

    // Static assets fallback (if ASSETS binding is present)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
};

async function handleApi(request: Request, env: Env, url: URL): Promise<Response> {
  // 1. CORS Preflight
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

  // 2. Rate Limiting per IP
  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    '127.0.0.1';

  const now = Date.now();
  let clientLimit = rateLimitMap.get(clientIp);

  if (!clientLimit || now > clientLimit.resetAt) {
    clientLimit = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitMap.set(clientIp, clientLimit);
  } else {
    clientLimit.count += 1;
  }

  const maxRequests = Number(env.RATE_LIMIT_PER_MINUTE) || DEFAULT_MAX_REQUESTS_PER_MINUTE;
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
        },
      }
    );
  }

  // 3. Request Payload Size Guard
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return new Response(
      JSON.stringify({
        status: 'error',
        code: 'PAYLOAD_TOO_LARGE',
        message: `Request payload exceeds maximum allowed size of ${MAX_PAYLOAD_BYTES / (1024 * 1024)}MB.`,
      }),
      { status: 413, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 4. Route Handling
  let response: Response;
  try {
    if (url.pathname === '/api/sync') {
      if (request.method === 'GET') {
        response = await onRequestGet({ request, env });
      } else if (request.method === 'POST') {
        response = await onRequestPost({ request, env });
      } else {
        response = new Response(JSON.stringify({ status: 'error', message: 'Method Not Allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      response = new Response(JSON.stringify({ status: 'error', message: 'Endpoint Not Found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (err: unknown) {
    console.error('Worker API error:', err);
    response = new Response(
      JSON.stringify({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An internal error occurred while processing the edge request.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 5. Inject Security Headers
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
}
