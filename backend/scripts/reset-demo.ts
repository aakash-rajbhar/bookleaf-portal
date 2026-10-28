import { pool } from '../src/db/pool';
import { seedDemo } from './seed-demo';

async function resetDemo() {
  if (process.env.CONFIRM_RESET !== 'yes') {
    console.error('Error: CONFIRM_RESET=yes environment variable is required to execute demo reset.');
    console.error('Usage: CONFIRM_RESET=yes npm run reset:demo');
    process.exit(1);
  }

  console.log('Resetting demo tickets, messages, notes, drafts, and AI telemetry logs...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Delete in dependency order (never touches authors, books, or users)
    await client.query('DELETE FROM ai_usage_log');
    await client.query('DELETE FROM ai_drafts');
    await client.query('DELETE FROM internal_notes');
    await client.query('DELETE FROM ticket_messages');
    await client.query('DELETE FROM tickets');

    await client.query('COMMIT');
    console.log('All ticket artifacts cleared successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  // Reseed with pristine 7 demo tickets
  await seedDemo();
}

if (require.main === module) {
  resetDemo()
    .then(() => {
      console.log('Demo reset and reseed complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Demo reset failed:', err);
      process.exit(1);
    });
}
