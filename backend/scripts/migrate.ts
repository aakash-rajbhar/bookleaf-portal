import fs from 'node:fs';
import path from 'node:path';
import { pool } from '../src/db/pool';

async function runMigrations() {
  const migrationsDir = path.resolve(__dirname, '../src/db/migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.error(`Migrations directory not found: ${migrationsDir}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration file(s) in ${migrationsDir}`);

  const client = await pool.connect();

  try {
    // Ensure migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    const { rows: appliedRows } = await client.query<{ name: string }>(
      'SELECT name FROM schema_migrations'
    );
    const appliedSet = new Set(appliedRows.map((r) => r.name));

    let appliedCount = 0;

    for (const file of files) {
      if (appliedSet.has(file)) {
        continue;
      }

      console.log(`Applying migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (name) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`✓ Successfully applied: ${file}`);
        appliedCount++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`✗ Error applying migration ${file}:`, err);
        throw err;
      }
    }

    if (appliedCount === 0) {
      console.log('No pending migrations. Database is up to date.');
    } else {
      console.log(`Successfully applied ${appliedCount} migration(s).`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
