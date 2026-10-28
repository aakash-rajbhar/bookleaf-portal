import { query } from '../db/pool';
import { AppError } from '../utils/errors';
import { triageQueue } from './triageQueue';
import {
  toAuthorTicketResponse,
  type AuthorTicketResponse,
  type TicketMessageRow,
  type TicketRow,
} from '../utils/mappers';

export interface CreateTicketInput {
  bookId?: string | null;
  subject: string;
  description: string;
}

export class TicketService {
  /**
   * Creates a new support ticket submitted by an author:
   * - Validates that bookId (if provided) belongs to the author, otherwise throws 400 INVALID_BOOK.
   * - Sets status to 'Open' and ai_status to 'pending' by default.
   * - Enqueues ticket to triageQueue (failure never blocks ticket creation).
   * - Returns author-facing ticket representation.
   */
  async createAuthorTicket(
    authorId: string,
    input: CreateTicketInput
  ): Promise<AuthorTicketResponse> {
    let bookTitle: string | null = null;
    const cleanBookId = input.bookId ? input.bookId.trim() : null;

    if (cleanBookId) {
      const bookRows = await query<{ id: string; title: string }>(
        'SELECT id, title FROM books WHERE id = $1 AND author_id = $2',
        [cleanBookId, authorId]
      );

      if (bookRows.length === 0) {
        throw new AppError(
          400,
          'INVALID_BOOK',
          'Selected book does not belong to your account'
        );
      }
      bookTitle = bookRows[0].title;
    }

    const insertSql = `
      INSERT INTO tickets (author_id, book_id, subject, description, status, ai_status)
      VALUES ($1, $2, $3, $4, 'Open', 'pending')
      RETURNING
        id,
        author_id,
        book_id,
        subject,
        description,
        status,
        created_at::text AS created_at,
        updated_at::text AS updated_at
    `;

    const insertedRows = await query<TicketRow>(insertSql, [
      authorId,
      cleanBookId,
      input.subject,
      input.description,
    ]);

    const ticket = insertedRows[0];
    ticket.book_title = bookTitle;

    // Trigger async triage hook; errors must never fail ticket creation
    try {
      await triageQueue.enqueue(ticket.id);
    } catch (err) {
      console.error(`Failed to enqueue ticket ${ticket.id} for triage:`, err);
    }

    return toAuthorTicketResponse(ticket, []);
  }

  /**
   * Lists tickets owned by the author, ordered newest first with pagination.
   */
  async listAuthorTickets(
    authorId: string,
    limit = 50,
    offset = 0
  ): Promise<AuthorTicketResponse[]> {
    const sql = `
      SELECT
        t.id,
        t.author_id,
        t.book_id,
        b.title AS book_title,
        t.subject,
        t.description,
        t.status,
        t.created_at::text AS created_at,
        t.updated_at::text AS updated_at
      FROM tickets t
      LEFT JOIN books b ON b.id = t.book_id
      WHERE t.author_id = $1
      ORDER BY t.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const rows = await query<TicketRow>(sql, [authorId, limit, offset]);
    return rows.map((r) => toAuthorTicketResponse(r, []));
  }

  /**
   * Retrieves single ticket and its message history for the author.
   * Returns 404 if ticket does not exist or belongs to another author.
   */
  async getAuthorTicketById(
    authorId: string,
    ticketId: string
  ): Promise<AuthorTicketResponse> {
    const ticketSql = `
      SELECT
        t.id,
        t.author_id,
        t.book_id,
        b.title AS book_title,
        t.subject,
        t.description,
        t.status,
        t.created_at::text AS created_at,
        t.updated_at::text AS updated_at
      FROM tickets t
      LEFT JOIN books b ON b.id = t.book_id
      WHERE t.id = $1
    `;

    const ticketRows = await query<TicketRow>(ticketSql, [ticketId]);
    if (ticketRows.length === 0) {
      throw AppError.notFound(`Ticket ${ticketId} not found`);
    }

    const ticket = ticketRows[0];
    if (ticket.author_id !== authorId) {
      // Return 404 to avoid leaking ticket existence
      throw AppError.notFound(`Ticket ${ticketId} not found`);
    }

    const messagesSql = `
      SELECT
        id,
        sender_role,
        body,
        created_at::text AS created_at
      FROM ticket_messages
      WHERE ticket_id = $1
      ORDER BY created_at ASC
    `;

    const messageRows = await query<TicketMessageRow>(messagesSql, [ticketId]);

    return toAuthorTicketResponse(ticket, messageRows);
  }
}

export const ticketService = new TicketService();
