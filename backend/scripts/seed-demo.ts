import { pool } from '../src/db/pool';

export const DEMO_TICKETS = [
  {
    id: 'd0000000-0000-4000-a000-000000000001',
    authorId: 'AUTH003', // Ananya Reddy
    bookId: 'BK005',     // Between Two Temples
    subject: 'Royalty payment not received for Between Two Temples',
    description: 'Hi, I noticed my pending royalty of Rs 2,546 has not been paid out yet. Could you please check when this will be processed?',
    status: 'Open',
    category: 'Royalty & Payments',
    categorySource: 'ai',
    priority: 'High',
    prioritySource: 'ai',
    aiStatus: 'done',
    aiReason: 'Author inquiry regarding pending royalty payment status and payout timeline.',
    assigneeRole: null,
    relativeCreated: "NOW() - interval '12 days'",
    relativeUpdated: "NOW() - interval '12 days'",
    relativeResolved: null,
    messages: [],
    internalNotes: [
      {
        id: 'd0000000-0000-4000-c000-000000000001',
        body: 'Checking with the finance team regarding Ananya’s pending royalty transfer schedule.',
        relativeCreated: "NOW() - interval '11 days'",
      },
    ],
  },
  {
    id: 'd0000000-0000-4000-a000-000000000002',
    authorId: 'AUTH001', // Priya Sharma
    bookId: 'BK001',     // Whispers of the Ganges
    subject: 'ISBN mismatch on Amazon listing',
    description: 'The paperback ISBN displayed on the Amazon listing does not match the copyright page in my published copies. Can someone look into this?',
    status: 'Open',
    category: 'ISBN & Metadata Issues',
    categorySource: 'ai',
    priority: 'High',
    prioritySource: 'ai',
    aiStatus: 'done',
    aiReason: 'High-priority metadata discrepancy on retailer distribution listing.',
    assigneeRole: null,
    relativeCreated: "NOW() - interval '3 hours'",
    relativeUpdated: "NOW() - interval '3 hours'",
    relativeResolved: null,
    messages: [],
    internalNotes: [],
  },
  {
    id: 'd0000000-0000-4000-a000-000000000003',
    authorId: 'AUTH009', // Kavita Deshmukh
    bookId: 'BK016',     // The Nagpur Notebooks
    subject: 'Royalty threshold inquiry',
    description: 'Hello, my sales dashboard shows Rs 850 in earned royalty. When does payout occur?',
    status: 'In Progress',
    category: 'Royalty & Payments',
    categorySource: 'ai',
    priority: 'Medium',
    prioritySource: 'ai',
    aiStatus: 'done',
    aiReason: 'General inquiry regarding minimum payout threshold for royalties.',
    assigneeRole: 'admin',
    relativeCreated: "NOW() - interval '2 days'",
    relativeUpdated: "NOW() - interval '1 day'",
    relativeResolved: null,
    messages: [
      {
        id: 'd0000000-0000-4000-b000-000000000001',
        sender: 'admin',
        body: 'Hello Kavita, royalty payouts are disbursed once cumulative earnings reach the minimum threshold of Rs 1,000, or at the annual sweep. Your current balance of Rs 850 will roll over to the next cycle.',
        relativeCreated: "NOW() - interval '1 day'",
      },
    ],
    internalNotes: [],
  },
  {
    id: 'd0000000-0000-4000-a000-000000000004',
    authorId: 'AUTH009', // Kavita Deshmukh
    bookId: 'BK015',     // Raising Roots (in production)
    subject: 'Update on typesetting status',
    description: 'Could you please give me an update on the typesetting progress for Raising Roots? It has been under review for three weeks.',
    status: 'Open',
    category: 'Book Status & Production Updates',
    categorySource: 'fallback',
    priority: 'Medium',
    prioritySource: 'fallback',
    aiStatus: 'failed',
    aiReason: 'Rule-based fallback: AI classification service timed out.',
    assigneeRole: null,
    relativeCreated: "NOW() - interval '5 days'",
    relativeUpdated: "NOW() - interval '5 days'",
    relativeResolved: null,
    messages: [],
    internalNotes: [],
  },
  {
    id: 'd0000000-0000-4000-a000-000000000005',
    authorId: 'AUTH001', // Priya Sharma
    bookId: null,        // General
    subject: 'Updating author bio on portal profile',
    description: 'I would like to update my author bio and profile photo. How do I request these changes?',
    status: 'Resolved',
    category: 'General Inquiry',
    categorySource: 'ai',
    priority: 'Low',
    prioritySource: 'ai',
    aiStatus: 'done',
    aiReason: 'Account level question regarding author profile metadata.',
    assigneeRole: 'admin',
    relativeCreated: "NOW() - interval '1 day'",
    relativeUpdated: "NOW() - interval '12 hours'",
    relativeResolved: "NOW() - interval '12 hours'",
    messages: [
      {
        id: 'd0000000-0000-4000-b000-000000000002',
        sender: 'admin',
        body: 'Hi Priya, you can send your updated bio and photo directly in reply to this ticket or update them in your author account settings. Marking this resolved for now!',
        relativeCreated: "NOW() - interval '12 hours'",
      },
    ],
    internalNotes: [],
  },
  {
    id: 'd0000000-0000-4000-a000-000000000006',
    authorId: 'AUTH002', // Rohit Kapoor
    bookId: 'BK003',     // Code & Karma
    subject: 'Printing defect on author copies',
    description: 'I received my box of 25 author copies today. On pages 42-45, the text is smudged and unreadable. Requesting a reprint replacement.',
    status: 'Open',
    category: 'Printing & Quality',
    categorySource: 'ai',
    priority: 'High',
    prioritySource: 'ai',
    aiStatus: 'done',
    aiReason: 'Physical book defect reported on delivered author copies.',
    assigneeRole: null,
    relativeCreated: "NOW() - interval '6 hours'",
    relativeUpdated: "NOW() - interval '6 hours'",
    relativeResolved: null,
    messages: [],
    internalNotes: [],
  },
  {
    id: 'd0000000-0000-4000-a000-000000000007',
    authorId: 'AUTH007', // Sneha Kulkarni
    bookId: 'BK011',     // The Algorithm of Love
    subject: 'Royalty calculation question',
    description: 'Hello, I wanted to understand how royalty per copy was computed for the bulk order last month.',
    status: 'Closed',
    category: 'Royalty & Payments',
    categorySource: 'ai',
    priority: 'Medium',
    prioritySource: 'ai',
    aiStatus: 'done',
    aiReason: 'Author inquiry regarding calculation formulas for bulk copy royalty.',
    assigneeRole: 'admin',
    relativeCreated: "NOW() - interval '4 days'",
    relativeUpdated: "NOW() - interval '2 days'",
    relativeResolved: "NOW() - interval '2 days'",
    messages: [
      {
        id: 'd0000000-0000-4000-b000-000000000003',
        sender: 'admin',
        body: 'Hi Sneha, bulk institutional orders receive standard author royalty per contract terms (10% of net discounted invoice price). Detailed breakdown was sent to your registered email.',
        relativeCreated: "NOW() - interval '2 days'",
      },
    ],
    internalNotes: [],
  },
];

export async function seedDemo() {
  const client = await pool.connect();

  try {
    // 1. Look up admin user for assignments, replies, and notes
    const adminRes = await client.query<{ id: string }>(
      "SELECT id FROM users WHERE role = 'admin' ORDER BY email ASC LIMIT 1"
    );
    if (adminRes.rows.length === 0) {
      throw new Error('No admin user found. Run npm run seed first to create users.');
    }
    const adminUserId = adminRes.rows[0].id;

    // 2. Look up author user IDs
    const authorsRes = await client.query<{ id: string; author_id: string }>(
      "SELECT id, author_id FROM users WHERE role = 'author'"
    );
    const authorUserMap = new Map<string, string>();
    for (const row of authorsRes.rows) {
      if (row.author_id) {
        authorUserMap.set(row.author_id, row.id);
      }
    }

    console.log('Seeding demo tickets directly via SQL (idempotent ON CONFLICT DO NOTHING)...');

    await client.query('BEGIN');

    let insertedCount = 0;

    for (const t of DEMO_TICKETS) {
      const assignedToId = t.assigneeRole === 'admin' ? adminUserId : null;

      const insertTicketSql = `
        INSERT INTO tickets (
          id, author_id, book_id, subject, description,
          status, category, category_source, priority, priority_source,
          ai_status, ai_reason, assigned_to, created_at, updated_at, resolved_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, ${t.relativeCreated}, ${t.relativeUpdated}, ${t.relativeResolved ? t.relativeResolved : 'NULL'}
        )
        ON CONFLICT (id) DO NOTHING
        RETURNING id;
      `;

      const ticketResult = await client.query(insertTicketSql, [
        t.id,
        t.authorId,
        t.bookId,
        t.subject,
        t.description,
        t.status,
        t.category,
        t.categorySource,
        t.priority,
        t.prioritySource,
        t.aiStatus,
        t.aiReason,
        assignedToId,
      ]);

      if (ticketResult.rows.length > 0) {
        insertedCount += 1;
      }

      // Seed messages for this ticket
      for (const m of t.messages) {
        const senderId = m.sender === 'admin' ? adminUserId : authorUserMap.get(t.authorId);
        if (!senderId) {
          throw new Error(`Sender user ID not found for author ${t.authorId}`);
        }

        await client.query(
          `INSERT INTO ticket_messages (id, ticket_id, sender_role, sender_id, body, created_at)
           VALUES ($1, $2, $3, $4, $5, ${m.relativeCreated})
           ON CONFLICT (id) DO NOTHING`,
          [m.id, t.id, m.sender, senderId, m.body]
        );
      }

      // Seed internal notes for this ticket
      for (const n of t.internalNotes) {
        await client.query(
          `INSERT INTO internal_notes (id, ticket_id, admin_id, body, created_at)
           VALUES ($1, $2, $3, $4, ${n.relativeCreated})
           ON CONFLICT (id) DO NOTHING`,
          [n.id, t.id, adminUserId, n.body]
        );
      }
    }

    await client.query('COMMIT');
    console.log(`Demo seed complete: ${insertedCount} new ticket(s) inserted (${DEMO_TICKETS.length} total demo tickets).`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Self-executing CLI wrapper
if (require.main === module) {
  seedDemo()
    .then(() => {
      console.log('Demo tickets ready.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Demo seed failed:', err);
      process.exit(1);
    });
}
