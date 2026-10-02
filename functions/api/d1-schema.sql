-- Cloudflare D1 SQLite Schema for Chronicle Journal
-- Run locally or remotely with: npx wrangler d1 execute DB --file=functions/api/d1-schema.sql

CREATE TABLE IF NOT EXISTS journals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'local_user',
    title TEXT NOT NULL,
    cover_style TEXT NOT NULL DEFAULT 'cognac',
    paper_style TEXT NOT NULL DEFAULT 'lined',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY,
    journal_id TEXT NOT NULL DEFAULT 'default_journal',
    page_number INTEGER NOT NULL,
    title TEXT,
    date_label TEXT,
    content_payload TEXT NOT NULL, -- JSON serialized text blocks, drawings, photos, stickers
    is_encrypted INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pages_journal ON pages(journal_id, page_number);
