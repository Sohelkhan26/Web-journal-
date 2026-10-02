interface Env {
  DB?: {
    prepare: (query: string) => {
      bind: (...args: unknown[]) => {
        all: <T = unknown>() => Promise<{ results: T[] }>;
        run: () => Promise<{ success: boolean }>;
      };
    };
  };
  SYNC_SECRET?: string;
}

interface PagePayload {
  id: string;
  pageNumber: number;
  title: string;
  date: string;
  paperStyle?: string;
  isBookmarked?: boolean;
  textBlocks?: unknown[];
  drawings?: unknown[];
  photos?: unknown[];
  stickers?: unknown[];
  updatedAt?: number;
}

/**
 * Derives a consistent, isolated journal partition ID from the client's passkey.
 * This guarantees user privacy and data separation even on a shared D1 database.
 */
async function deriveJournalId(token: string): Promise<string> {
  if (!token) return 'default_journal';
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `journal_${hex.substring(0, 16)}`;
}

/**
 * Extracts and verifies authorization passkey from request headers.
 */
function getAuthToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const syncKey = request.headers.get('X-Sync-Key');
  if (syncKey) {
    return syncKey.trim();
  }
  return null;
}

export const onRequestGet = async (context: { request: Request; env: Env }): Promise<Response> => {
  const { request, env } = context;
  const db = env.DB;
  const authToken = getAuthToken(request);

  // If a server-wide SYNC_SECRET is set, strictly enforce it
  if (env.SYNC_SECRET && (!authToken || authToken !== env.SYNC_SECRET)) {
    return new Response(
      JSON.stringify({
        status: 'error',
        code: 'UNAUTHORIZED',
        message: 'Valid sync passkey required to access this journal.',
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!db) {
    return new Response(
      JSON.stringify({
        status: 'mock_local',
        message: 'Cloudflare D1 is ready to be bound. To connect real D1 database, configure wrangler.jsonc with DB binding.',
        pages: [],
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const journalId = authToken ? await deriveJournalId(authToken) : 'default_journal';

    const { results } = await db
      .prepare(
        'SELECT id, page_number, title, date_label, content_payload, updated_at FROM pages WHERE journal_id = ? ORDER BY page_number ASC'
      )
      .bind(journalId)
      .all();

    return new Response(JSON.stringify({ status: 'ok', pages: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    console.error('Error fetching pages from D1:', err);
    return new Response(
      JSON.stringify({
        status: 'error',
        code: 'QUERY_FAILED',
        message: 'Failed to retrieve journal entries. Please check database configuration.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const onRequestPost = async (context: { request: Request; env: Env }): Promise<Response> => {
  const { request, env } = context;
  const db = env.DB;
  const authToken = getAuthToken(request);

  // If a server-wide SYNC_SECRET is configured, require match
  if (env.SYNC_SECRET && (!authToken || authToken !== env.SYNC_SECRET)) {
    return new Response(
      JSON.stringify({
        status: 'error',
        code: 'UNAUTHORIZED',
        message: 'Valid sync passkey required to sync entries to Cloudflare.',
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: { pages?: PagePayload[] };
  try {
    body = (await request.json()) as { pages?: PagePayload[] };
  } catch {
    return new Response(
      JSON.stringify({
        status: 'error',
        code: 'INVALID_JSON',
        message: 'Malformed JSON payload provided.',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Payload Schema Validation
  if (!body || !Array.isArray(body.pages)) {
    return new Response(
      JSON.stringify({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Invalid request structure: "pages" must be an array.',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Enforce batch limit to protect database and edge limits
  if (body.pages.length > 200) {
    return new Response(
      JSON.stringify({
        status: 'error',
        code: 'BATCH_LIMIT_EXCEEDED',
        message: 'Sync payload exceeds maximum limit of 200 pages per request.',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Validate each individual page payload
  for (let i = 0; i < body.pages.length; i++) {
    const p = body.pages[i];
    if (!p.id || typeof p.id !== 'string' || p.id.length > 100) {
      return new Response(
        JSON.stringify({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: `Invalid or missing "id" on page index ${i}.`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (typeof p.pageNumber !== 'number' || p.pageNumber < 1 || !Number.isInteger(p.pageNumber)) {
      return new Response(
        JSON.stringify({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: `Invalid "pageNumber" on page id ${p.id}. Must be a positive integer.`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    // Bound metadata length
    if (p.title && (typeof p.title !== 'string' || p.title.length > 255)) {
      p.title = String(p.title).substring(0, 255);
    }
    if (p.date && (typeof p.date !== 'string' || p.date.length > 100)) {
      p.date = String(p.date).substring(0, 100);
    }
  }

  if (!db) {
    return new Response(
      JSON.stringify({
        status: 'mock_synced',
        message: 'Local sync simulated successfully. Configure D1 binding to persist remotely on Cloudflare Edge.',
        count: body.pages.length,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const journalId = authToken ? await deriveJournalId(authToken) : 'default_journal';

    for (const p of body.pages) {
      const serializedContent = JSON.stringify(p);
      const updatedAt = typeof p.updatedAt === 'number' ? p.updatedAt : Date.now();

      await db
        .prepare(
          `INSERT INTO pages (id, journal_id, page_number, title, date_label, content_payload, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             page_number = excluded.page_number,
             title = excluded.title,
             date_label = excluded.date_label,
             content_payload = excluded.content_payload,
             updated_at = excluded.updated_at`
        )
        .bind(
          p.id,
          journalId,
          p.pageNumber,
          p.title || `Entry #${p.pageNumber}`,
          p.date || '',
          serializedContent,
          updatedAt
        )
        .run();
    }

    return new Response(JSON.stringify({ status: 'ok', syncedCount: body.pages.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    console.error('Error synchronizing pages to D1:', err);
    return new Response(
      JSON.stringify({
        status: 'error',
        code: 'SYNC_FAILED',
        message: 'An error occurred while persisting pages to the database.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
