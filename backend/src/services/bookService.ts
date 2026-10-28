import { query } from '../db/pool';
import { AppError } from '../utils/errors';
import { toBookResponse, type BookResponse, type BookRow } from '../utils/mappers';
import type { RequestUser } from '../types/express';

export class BookService {
  /**
   * Retrieves books accessible to the user:
   * - Authors see only their own books.
   * - Admins see all books, with optional filter by authorId.
   */
  async listBooks(user: RequestUser, authorIdFilter?: string): Promise<BookResponse[]> {
    if (user.role === 'author') {
      if (!user.authorId) {
        return [];
      }

      const sql = `
        SELECT
          b.id,
          b.author_id,
          b.title,
          b.isbn,
          b.genre,
          b.publication_date::text AS publication_date,
          b.status,
          b.mrp,
          b.copies_sold,
          b.royalty_per_copy,
          b.royalty_earned,
          b.royalty_paid,
          b.royalty_pending,
          b.last_payout_date::text AS last_payout_date,
          b.print_partner,
          b.available_on,
          a.name AS author_name
        FROM books b
        JOIN authors a ON a.id = b.author_id
        WHERE b.author_id = $1
        ORDER BY b.publication_date DESC NULLS LAST, b.title ASC
      `;

      const rows = await query<BookRow>(sql, [user.authorId]);
      return rows.map((r) => toBookResponse(r, false));
    }

    // Admin view
    let sql = `
      SELECT
        b.id,
        b.author_id,
        b.title,
        b.isbn,
        b.genre,
        b.publication_date::text AS publication_date,
        b.status,
        b.mrp,
        b.copies_sold,
        b.royalty_per_copy,
        b.royalty_earned,
        b.royalty_paid,
        b.royalty_pending,
        b.last_payout_date::text AS last_payout_date,
        b.print_partner,
        b.available_on,
        a.name AS author_name
      FROM books b
      JOIN authors a ON a.id = b.author_id
    `;
    const params: unknown[] = [];

    if (authorIdFilter) {
      sql += ' WHERE b.author_id = $1';
      params.push(authorIdFilter);
    }

    sql += ' ORDER BY b.publication_date DESC NULLS LAST, b.title ASC';

    const rows = await query<BookRow>(sql, params);
    return rows.map((r) => toBookResponse(r, true));
  }

  /**
   * Retrieves single book by ID:
   * - Authors: 404 if not found OR if owned by another author (do not leak existence).
   * - Admins: can view any book.
   */
  async getBookById(user: RequestUser, bookId: string): Promise<BookResponse> {
    const sql = `
      SELECT
        b.id,
        b.author_id,
        b.title,
        b.isbn,
        b.genre,
        b.publication_date::text AS publication_date,
        b.status,
        b.mrp,
        b.copies_sold,
        b.royalty_per_copy,
        b.royalty_earned,
        b.royalty_paid,
        b.royalty_pending,
        b.last_payout_date::text AS last_payout_date,
        b.print_partner,
        b.available_on,
        a.name AS author_name
      FROM books b
      JOIN authors a ON a.id = b.author_id
      WHERE b.id = $1
    `;

    const rows = await query<BookRow>(sql, [bookId]);
    if (rows.length === 0) {
      throw AppError.notFound(`Book ${bookId} not found`);
    }

    const book = rows[0];

    if (user.role === 'author') {
      if (book.author_id !== user.authorId) {
        // Return 404 instead of 403 to prevent ID probing / existence leakage
        throw AppError.notFound(`Book ${bookId} not found`);
      }
      return toBookResponse(book, false);
    }

    return toBookResponse(book, true);
  }
}

export const bookService = new BookService();
