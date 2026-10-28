# T02 DB pool + migrations
Goal: tables from `docs/DATA_MODEL.md` created by `npm run migrate`.
Files: `backend/src/db/pool.ts` (already exists, check), `backend/src/db/migrations/001_init.sql`, `backend/scripts/migrate.ts` (runs *.sql in order, tracks applied in `schema_migrations` table, idempotent).
Rules: use `gen_random_uuid()` (pgcrypto/PG13+), CHECK constraints for enums, FKs with sensible ON DELETE, the indexes listed in DATA_MODEL.
Acceptance: running migrate twice is safe; `\dt` shows all tables; health route reports db ok.
Commit: `feat(db): initial schema and migration runner`.
