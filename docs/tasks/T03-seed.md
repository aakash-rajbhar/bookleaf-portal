# T03 Seed script
Goal: `npm run seed` loads `data/bookleaf_sample_data.json`.
Files: `backend/scripts/seed.ts` (or `src/db/seed.ts`).
Rules: idempotent (upsert by id / truncate-and-reload inside one transaction); map JSON fields -> columns (author_royalty_per_copy->royalty_per_copy, total_copies_sold->copies_sold, total_royalty_earned->royalty_earned, last_royalty_payout_date->last_payout_date, available_on->text[]); nulls stay null.
Users: one per author (author email, password `Password@123`, bcrypt), role author, author_id set. Admins: `admin@bookleaf.com`, `admin2@bookleaf.com`, same password, role admin.
Optional: seed 4-6 demo tickets in various states so the demo isn't empty (mark clearly as demo).
Acceptance: 10 authors, 18 books, 12 users; BK013/BK015 have null mrp. Print counts at the end.
Commit: `feat(db): seed script`.
