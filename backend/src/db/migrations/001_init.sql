-- Enable pgcrypto for gen_random_uuid if on older PG (built-in in PG13+)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Authors
CREATE TABLE IF NOT EXISTS authors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  joined_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users (both authors and admins)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('author', 'admin')),
  name TEXT NOT NULL,
  author_id TEXT REFERENCES authors(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Books
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  isbn TEXT NOT NULL,
  genre TEXT NOT NULL,
  publication_date DATE NULL,
  status TEXT NOT NULL,
  mrp INTEGER NULL,
  royalty_per_copy INTEGER NULL,
  copies_sold INTEGER NOT NULL DEFAULT 0,
  royalty_earned INTEGER NOT NULL DEFAULT 0,
  royalty_paid INTEGER NOT NULL DEFAULT 0,
  royalty_pending INTEGER NOT NULL DEFAULT 0,
  last_payout_date DATE NULL,
  print_partner TEXT NULL,
  available_on TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id TEXT NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  book_id TEXT REFERENCES books(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
  category TEXT NULL CHECK (category IN (
    'Royalty & Payments',
    'ISBN & Metadata',
    'Printing & Quality',
    'Distribution',
    'Production Updates',
    'General'
  )),
  category_source TEXT NULL CHECK (category_source IN ('ai', 'fallback', 'admin')),
  priority TEXT NULL CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
  priority_source TEXT NULL CHECK (priority_source IN ('ai', 'fallback', 'admin')),
  ai_status TEXT NOT NULL DEFAULT 'pending' CHECK (ai_status IN ('pending', 'done', 'failed')),
  ai_reason TEXT NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ NULL
);

-- Ticket messages (author <-> admin conversation thread)
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('author', 'admin')),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Internal notes (admins only, NEVER exposed to authors)
CREATE TABLE IF NOT EXISTS internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI drafted responses for admin review
CREATE TABLE IF NOT EXISTS ai_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  draft_text TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit/telemetry log for AI operations (cost & latency awareness)
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  task TEXT NOT NULL CHECK (task IN ('triage', 'draft')),
  model TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  success BOOLEAN NOT NULL,
  error TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes (from DATA_MODEL.md and key foreign keys)
CREATE INDEX IF NOT EXISTS idx_tickets_author_id ON tickets(author_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status_priority_created ON tickets(status, priority, created_at);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_created ON ticket_messages(ticket_id, created_at);
CREATE INDEX IF NOT EXISTS idx_internal_notes_ticket_created ON internal_notes(ticket_id, created_at);
CREATE INDEX IF NOT EXISTS idx_books_author_id ON books(author_id);
CREATE INDEX IF NOT EXISTS idx_users_author_id ON users(author_id);
CREATE INDEX IF NOT EXISTS idx_ai_drafts_ticket_id ON ai_drafts(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_ticket_id ON ai_usage_log(ticket_id);
