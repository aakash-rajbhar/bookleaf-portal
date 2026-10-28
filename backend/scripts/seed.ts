import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { pool } from '../src/db/pool';

interface RawBook {
  book_id: string;
  title: string;
  isbn: string;
  genre: string;
  publication_date: string | null;
  status: string;
  mrp: number | null;
  author_royalty_per_copy: number | null;
  total_copies_sold: number;
  total_royalty_earned: number;
  royalty_paid: number;
  royalty_pending: number;
  last_royalty_payout_date: string | null;
  print_partner: string | null;
  available_on: string[];
}

interface RawAuthor {
  author_id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  joined_date: string;
  books: RawBook[];
}

interface SampleData {
  authors: RawAuthor[];
}

async function seed() {
  const dataPath = path.resolve(__dirname, '../../data/bookleaf_sample_data.json');

  if (!fs.existsSync(dataPath)) {
    console.error(`Sample data file not found at: ${dataPath}`);
    process.exit(1);
  }

  const rawJson = fs.readFileSync(dataPath, 'utf8');
  const data: SampleData = JSON.parse(rawJson);

  console.log(`Loaded sample data with ${data.authors.length} authors.`);

  // Hash default password once with cost factor 10
  console.log('Generating password hash (bcrypt cost 10)...');
  const passwordHash = await bcrypt.hash('Password@123', 10);

  const client = await pool.connect();

  try {
    console.log('Starting seed transaction...');
    await client.query('BEGIN');

    // 1. Authors
    for (const author of data.authors) {
      await client.query(
        `INSERT INTO authors (id, name, email, phone, city, joined_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           email = EXCLUDED.email,
           phone = EXCLUDED.phone,
           city = EXCLUDED.city,
           joined_date = EXCLUDED.joined_date`,
        [
          author.author_id,
          author.name,
          author.email,
          author.phone,
          author.city,
          author.joined_date,
        ]
      );
    }

    // 2. Books
    for (const author of data.authors) {
      for (const book of author.books) {
        await client.query(
          `INSERT INTO books (
             id, author_id, title, isbn, genre, publication_date, status, mrp,
             royalty_per_copy, copies_sold, royalty_earned, royalty_paid,
             royalty_pending, last_payout_date, print_partner, available_on
           ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8,
             $9, $10, $11, $12,
             $13, $14, $15, $16
           )
           ON CONFLICT (id) DO UPDATE SET
             author_id = EXCLUDED.author_id,
             title = EXCLUDED.title,
             isbn = EXCLUDED.isbn,
             genre = EXCLUDED.genre,
             publication_date = EXCLUDED.publication_date,
             status = EXCLUDED.status,
             mrp = EXCLUDED.mrp,
             royalty_per_copy = EXCLUDED.royalty_per_copy,
             copies_sold = EXCLUDED.copies_sold,
             royalty_earned = EXCLUDED.royalty_earned,
             royalty_paid = EXCLUDED.royalty_paid,
             royalty_pending = EXCLUDED.royalty_pending,
             last_payout_date = EXCLUDED.last_payout_date,
             print_partner = EXCLUDED.print_partner,
             available_on = EXCLUDED.available_on`,
          [
            book.book_id,
            author.author_id,
            book.title,
            book.isbn,
            book.genre,
            book.publication_date ?? null,
            book.status,
            book.mrp !== null && book.mrp !== undefined ? book.mrp : null,
            book.author_royalty_per_copy !== null && book.author_royalty_per_copy !== undefined
              ? book.author_royalty_per_copy
              : null,
            book.total_copies_sold ?? 0,
            book.total_royalty_earned ?? 0,
            book.royalty_paid ?? 0,
            book.royalty_pending ?? 0,
            book.last_royalty_payout_date ?? null,
            book.print_partner ?? null,
            book.available_on ?? [],
          ]
        );
      }
    }

    // 3. Author Users (one per author)
    for (const author of data.authors) {
      await client.query(
        `INSERT INTO users (email, password_hash, role, name, author_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role,
           name = EXCLUDED.name,
           author_id = EXCLUDED.author_id`,
        [author.email, passwordHash, 'author', author.name, author.author_id]
      );
    }

    // 4. Admin Users
    const admins = [
      {
        email: 'admin@bookleaf.com',
        name: 'BookLeaf Admin',
      },
      {
        email: 'admin2@bookleaf.com',
        name: 'BookLeaf Support Lead',
      },
    ];

    for (const admin of admins) {
      await client.query(
        `INSERT INTO users (email, password_hash, role, name, author_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role,
           name = EXCLUDED.name,
           author_id = EXCLUDED.author_id`,
        [admin.email, passwordHash, 'admin', admin.name, null]
      );
    }

    // Fetch and verify counts inside the transaction
    const { rows: [{ count: authorCount }] } = await client.query<{ count: number }>(
      'SELECT COUNT(*)::int as count FROM authors'
    );
    const { rows: [{ count: bookCount }] } = await client.query<{ count: number }>(
      'SELECT COUNT(*)::int as count FROM books'
    );
    const { rows: [{ count: userCount }] } = await client.query<{ count: number }>(
      'SELECT COUNT(*)::int as count FROM users'
    );
    const { rows: nullMrpBooks } = await client.query<{ id: string; title: string; mrp: number | null }>(
      'SELECT id, title, mrp FROM books WHERE mrp IS NULL ORDER BY id'
    );

    await client.query('COMMIT');
    console.log('✓ Transaction committed successfully.');

    console.log('\n--- Seed Summary ---');
    console.log(`Authors count: ${authorCount}`);
    console.log(`Books count:   ${bookCount}`);
    console.log(`Users count:   ${userCount}`);
    console.log(`Books with null MRP (${nullMrpBooks.length}):`);
    nullMrpBooks.forEach((b) => console.log(`  - [${b.id}] ${b.title} (mrp: ${b.mrp})`));

    // Verify UTF-8 check for Durga's Daughters
    const { rows: [durgaBook] } = await client.query<{ id: string; title: string }>(
      "SELECT id, title FROM books WHERE id = 'BK017'"
    );
    if (durgaBook) {
      console.log(`UTF-8 title check: [${durgaBook.id}] -> "${durgaBook.title}"`);
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed transaction rolled back due to error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
