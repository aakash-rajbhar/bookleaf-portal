-- Migration 004: Align ticket categories with exact assignment required names
-- 1. Drop the existing category CHECK constraint first so rows can be updated
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_category_check;

-- 2. Update existing ticket rows to the new category names
UPDATE tickets SET category = 'ISBN & Metadata Issues' WHERE category = 'ISBN & Metadata';
UPDATE tickets SET category = 'Distribution & Availability' WHERE category = 'Distribution';
UPDATE tickets SET category = 'Book Status & Production Updates' WHERE category = 'Production Updates';
UPDATE tickets SET category = 'General Inquiry' WHERE category = 'General';

-- 3. Add recreated CHECK constraint with the exact 6 assignment categories
ALTER TABLE tickets ADD CONSTRAINT tickets_category_check CHECK (category IN (
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry'
));
