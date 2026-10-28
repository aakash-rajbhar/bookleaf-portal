-- Add draft source column and allow NULL model for template drafts
ALTER TABLE ai_drafts ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'ai' CHECK (source IN ('ai', 'template'));
ALTER TABLE ai_drafts ALTER COLUMN model DROP NOT NULL;
