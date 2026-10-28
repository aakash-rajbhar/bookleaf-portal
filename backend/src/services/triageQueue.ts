import { pool } from '../db/pool';
import { triageTicket } from '../ai/triage';
import { publishTicketEvent } from './ticketEvents';

interface TicketRow {
  id: string;
  author_id: string;
  book_id: string | null;
  subject: string;
  description: string;
  category_source: string | null;
  priority_source: string | null;
}

interface BookRow {
  id: string;
  title: string;
  status: string;
  royalty_pending: number;
  royalty_paid: number;
  last_payout_date: string | null;
}

/**
 * In-memory sequential queue (concurrency 1) for asynchronous AI ticket triage.
 * Runs asynchronously after the HTTP response and never crashes the server.
 */
export class TriageQueue {
  private queue: string[] = [];
  private processing = false;

  /**
   * Enqueue a ticket for triage. Returns immediately.
   */
  async enqueue(ticketId: string): Promise<void> {
    try {
      if (!this.queue.includes(ticketId)) {
        this.queue.push(ticketId);
      }
      setImmediate(() => {
        this.processNext().catch((err) => {
          console.error(
            `[TriageQueue] Queue worker error:`,
            err instanceof Error ? err.message : String(err)
          );
        });
      });
    } catch (err) {
      console.error(
        `[TriageQueue] Failed to enqueue ticket:`,
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  private async processNext(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    const ticketId = this.queue.shift()!;

    try {
      await this.processJob(ticketId);
    } catch (err) {
      // Log ticket id only, never user text
      console.error(
        `[TriageQueue] Failed triage for ticket ${ticketId}:`,
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      this.processing = false;
      if (this.queue.length > 0) {
        setImmediate(() => {
          this.processNext().catch(() => {});
        });
      }
    }
  }

  private async processJob(ticketId: string): Promise<void> {
    // 1. Load ticket
    const ticketRes = await pool.query<TicketRow>(
      `SELECT id, author_id, book_id, subject, description, category_source, priority_source
       FROM tickets WHERE id = $1`,
      [ticketId]
    );

    if (ticketRes.rows.length === 0) {
      return;
    }

    const ticket = ticketRes.rows[0];

    // 2. Load minimal book context if book_id present
    let bookContext: {
      title: string;
      status: string;
      royaltyPending?: number;
      royaltyPaid?: number;
      lastPayoutDate?: string | null;
    } | null = null;

    if (ticket.book_id) {
      const bookRes = await pool.query<BookRow>(
        `SELECT id, title, status, royalty_pending, royalty_paid, last_payout_date
         FROM books WHERE id = $1`,
        [ticket.book_id]
      );
      if (bookRes.rows.length > 0) {
        const b = bookRes.rows[0];
        bookContext = {
          title: b.title,
          status: b.status,
          royaltyPending: b.royalty_pending,
          royaltyPaid: b.royalty_paid,
          lastPayoutDate: b.last_payout_date ? String(b.last_payout_date) : null,
        };
      }
    }

    // 3. Run triage (AI with automatic rule-based fallback and telemetry)
    const result = await triageTicket({
      id: ticket.id,
      subject: ticket.subject,
      description: ticket.description,
      book: bookContext,
    });

    // 4. Update ticket: NEVER overwrite fields with admin override
    const sql = `
      UPDATE tickets
      SET
        category = CASE WHEN category_source = 'admin' THEN category ELSE $1 END,
        category_source = CASE WHEN category_source = 'admin' THEN category_source ELSE $2 END,
        priority = CASE WHEN priority_source = 'admin' THEN priority ELSE $3 END,
        priority_source = CASE WHEN priority_source = 'admin' THEN priority_source ELSE $4 END,
        ai_status = $5,
        ai_reason = $6,
        updated_at = now()
      WHERE id = $7
    `;

    await pool.query(sql, [
      result.category,
      result.source,
      result.priority,
      result.source,
      result.aiStatus,
      result.reason,
      ticket.id,
    ]);

    // 5. Publish real-time event for admins
    publishTicketEvent({ admins: true }, { type: 'ticket.triaged', ticketId: ticket.id });
  }

  /**
   * On server boot, re-enqueue tickets with ai_status='pending' older than 1 minute.
   */
  async startRecovery(): Promise<void> {
    try {
      const res = await pool.query<{ id: string }>(
        `SELECT id FROM tickets
         WHERE ai_status = 'pending' AND created_at < (now() - INTERVAL '1 minute')
         ORDER BY created_at ASC`
      );

      for (const row of res.rows) {
        await this.enqueue(row.id);
      }

      if (res.rows.length > 0) {
        console.log(`[TriageQueue] Recovered ${res.rows.length} pending ticket(s) from prior session.`);
      }
    } catch (err) {
      console.error(
        `[TriageQueue] Failed startup recovery:`,
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  /**
   * Inspect queue size for testing.
   */
  getQueueLength(): number {
    return this.queue.length;
  }
}

export const triageQueue = new TriageQueue();
