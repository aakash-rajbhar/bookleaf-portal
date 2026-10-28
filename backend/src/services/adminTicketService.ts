import { pool, query } from '../db/pool';
import { AppError } from '../utils/errors';
import { publishTicketEvent } from './ticketEvents';
import {
  toAdminTicketItemResponse,
  toBookResponse,
  computeAgeHours,
  computeIsOverdue,
  type AdminTicketItemResponse,
  type AdminTicketDetailResponse,
  type AdminTicketRow,
  type AdminInternalNoteResponse,
  type TicketMessageResponse,
  type TicketMessageRow,
  type BookRow,
} from '../utils/mappers';
import {
  TICKET_STATUSES,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  type TicketStatus,
  type TicketCategory,
  type TicketPriority,
} from '../constants/ticket';

export interface AdminTicketsQuery {
  status?: TicketStatus;
  category?: TicketCategory;
  priority?: TicketPriority;
  from?: string;
  to?: string;
  assignedTo?: 'me' | 'unassigned' | string;
  q?: string;
  sort?: 'urgency' | 'newest' | 'oldest';
  limit?: number;
  offset?: number;
}

export interface PatchTicketInput {
  status?: TicketStatus;
  category?: TicketCategory;
  priority?: TicketPriority;
  assignedTo?: 'me' | string | null;
}

export class AdminTicketService {
  /**
   * Retrieves paginated admin tickets matching filters.
   * All filtering and sorting is parameterized in SQL.
   */
  async listTickets(
    params: AdminTicketsQuery,
    currentUserId: string
  ): Promise<{
    items: AdminTicketItemResponse[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const limit = params.limit ?? 25;
    const offset = params.offset ?? 0;
    const sort = params.sort ?? 'urgency';

    const whereClauses: string[] = [];
    const values: unknown[] = [];

    if (params.status && TICKET_STATUSES.includes(params.status)) {
      values.push(params.status);
      whereClauses.push(`t.status = $${values.length}`);
    }

    if (params.category && TICKET_CATEGORIES.includes(params.category)) {
      values.push(params.category);
      whereClauses.push(`t.category = $${values.length}`);
    }

    if (params.priority && TICKET_PRIORITIES.includes(params.priority)) {
      values.push(params.priority);
      whereClauses.push(`t.priority = $${values.length}`);
    }

    if (params.from) {
      values.push(params.from);
      whereClauses.push(`t.created_at >= $${values.length}::timestamptz`);
    }

    if (params.to) {
      values.push(params.to);
      // 'to' is inclusive of the whole day
      whereClauses.push(`t.created_at < ($${values.length}::date + interval '1 day')`);
    }

    if (params.assignedTo) {
      if (params.assignedTo === 'me') {
        values.push(currentUserId);
        whereClauses.push(`t.assigned_to = $${values.length}`);
      } else if (params.assignedTo === 'unassigned') {
        whereClauses.push(`t.assigned_to IS NULL`);
      } else {
        values.push(params.assignedTo);
        whereClauses.push(`t.assigned_to = $${values.length}`);
      }
    }

    if (params.q && params.q.trim()) {
      values.push(`%${params.q.trim()}%`);
      whereClauses.push(`t.subject ILIKE $${values.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    let orderSql = '';
    if (sort === 'newest') {
      orderSql = 'ORDER BY t.created_at DESC';
    } else if (sort === 'oldest') {
      orderSql = 'ORDER BY t.created_at ASC';
    } else {
      // 'urgency' (default): unresolved first, priority rank ASC, created_at ASC
      orderSql = `
        ORDER BY
          CASE WHEN t.status IN ('Open', 'In Progress') THEN 0 ELSE 1 END ASC,
          CASE COALESCE(t.priority, 'Medium')
            WHEN 'Critical' THEN 0
            WHEN 'High' THEN 1
            WHEN 'Medium' THEN 2
            WHEN 'Low' THEN 3
            ELSE 4
          END ASC,
          t.created_at ASC
      `;
    }

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM tickets t
      ${whereSql}
    `;

    const countRows = await query<{ total: number }>(countSql, values);
    const total = countRows[0]?.total ?? 0;

    const dataValues = [...values];
    dataValues.push(limit);
    const limitIndex = dataValues.length;
    dataValues.push(offset);
    const offsetIndex = dataValues.length;

    const itemsSql = `
      SELECT
        t.id,
        t.author_id,
        a.name AS author_name,
        t.book_id,
        b.title AS book_title,
        t.subject,
        t.status,
        t.category,
        t.category_source,
        t.priority,
        t.priority_source,
        t.ai_status,
        t.assigned_to,
        u.name AS assigned_to_name,
        t.created_at::text AS created_at,
        t.updated_at::text AS updated_at
      FROM tickets t
      JOIN authors a ON a.id = t.author_id
      LEFT JOIN books b ON b.id = t.book_id
      LEFT JOIN users u ON u.id = t.assigned_to
      ${whereSql}
      ${orderSql}
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;

    const itemRows = await query<AdminTicketRow>(itemsSql, dataValues);
    const items = itemRows.map(toAdminTicketItemResponse);

    return { items, total, limit, offset };
  }

  /**
   * Retrieves full ticket details for admin viewing:
   * Includes author profile, full book facts, messages, internal notes, and AI info.
   */
  async getTicketById(ticketId: string): Promise<AdminTicketDetailResponse> {
    const ticketSql = `
      SELECT
        t.id,
        t.author_id,
        a.name AS author_name,
        a.email AS author_email,
        a.city AS author_city,
        t.book_id,
        b.title AS book_title,
        t.subject,
        t.description,
        t.status,
        t.category,
        t.category_source,
        t.priority,
        t.priority_source,
        t.ai_status,
        t.ai_reason,
        t.assigned_to,
        u.name AS assigned_to_name,
        t.created_at::text AS created_at,
        t.updated_at::text AS updated_at,
        t.resolved_at::text AS resolved_at
      FROM tickets t
      JOIN authors a ON a.id = t.author_id
      LEFT JOIN books b ON b.id = t.book_id
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE t.id = $1
    `;

    const ticketRows = await query<AdminTicketRow>(ticketSql, [ticketId]);
    if (ticketRows.length === 0) {
      throw AppError.notFound(`Ticket ${ticketId} not found`);
    }

    const t = ticketRows[0];

    // Fetch full book facts if book_id is set
    let book = null;
    if (t.book_id) {
      const bookSql = `
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
      const bookRows = await query<BookRow>(bookSql, [t.book_id]);
      if (bookRows.length > 0) {
        book = toBookResponse(bookRows[0], true);
      }
    }

    // Fetch messages in ASC order
    const msgSql = `
      SELECT id, sender_role, body, created_at::text AS created_at
      FROM ticket_messages
      WHERE ticket_id = $1
      ORDER BY created_at ASC
    `;
    const messageRows = await query<TicketMessageRow>(msgSql, [ticketId]);
    const messages: TicketMessageResponse[] = messageRows.map((m) => ({
      id: m.id,
      senderRole: m.sender_role,
      body: m.body,
      createdAt: m.created_at,
    }));

    // Fetch internal notes with admin name in ASC order
    const notesSql = `
      SELECT
        n.id,
        n.admin_id,
        u.name AS admin_name,
        n.body,
        n.created_at::text AS created_at
      FROM internal_notes n
      JOIN users u ON u.id = n.admin_id
      WHERE n.ticket_id = $1
      ORDER BY n.created_at ASC
    `;
    const noteRows = await query<{
      id: string;
      admin_id: string;
      admin_name: string;
      body: string;
      created_at: string;
    }>(notesSql, [ticketId]);

    const internalNotes: AdminInternalNoteResponse[] = noteRows.map((n) => ({
      id: n.id,
      adminId: n.admin_id,
      adminName: n.admin_name,
      body: n.body,
      createdAt: n.created_at,
    }));

    // Fetch latest AI draft
    const draftSql = `
      SELECT id, draft_text, model, created_at::text AS created_at
      FROM ai_drafts
      WHERE ticket_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const draftRows = await query<{
      id: string;
      draft_text: string;
      model: string;
      created_at: string;
    }>(draftSql, [ticketId]);

    const latestDraft =
      draftRows.length > 0
        ? {
            id: draftRows[0].id,
            draftText: draftRows[0].draft_text,
            model: draftRows[0].model,
            createdAt: draftRows[0].created_at,
          }
        : null;

    const ageHours = computeAgeHours(t.created_at);
    const isOverdue = computeIsOverdue(t.status, t.priority, ageHours);

    return {
      id: t.id,
      subject: t.subject,
      description: t.description ?? '',
      status: t.status,
      category: t.category,
      categorySource: t.category_source,
      priority: t.priority,
      prioritySource: t.priority_source,
      aiStatus: t.ai_status,
      aiReason: t.ai_reason ?? null,
      authorId: t.author_id,
      authorName: t.author_name,
      bookId: t.book_id ?? null,
      bookTitle: t.book_title ?? null,
      assignedTo:
        t.assigned_to && t.assigned_to_name
          ? { id: t.assigned_to, name: t.assigned_to_name }
          : null,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      resolvedAt: t.resolved_at ?? null,
      ageHours,
      isOverdue,
      author: {
        id: t.author_id,
        name: t.author_name,
        email: t.author_email ?? '',
        city: t.author_city ?? '',
      },
      book,
      messages,
      internalNotes,
      latestDraft,
    };
  }

  /**
   * Updates ticket fields (status, category, priority, assignedTo) inside a transaction.
   * Tracks manual admin overrides for category and priority.
   * Manages resolved_at timestamp.
   * Fires ticket.updated event if status changed.
   */
  async updateTicket(
    ticketId: string,
    updates: PatchTicketInput,
    adminId: string
  ): Promise<AdminTicketDetailResponse> {
    const client = await pool.connect();
    let authorId = '';
    let statusChanged = false;

    try {
      await client.query('BEGIN');

      const existingRes = await client.query<{
        id: string;
        author_id: string;
        status: TicketStatus;
      }>(
        'SELECT id, author_id, status FROM tickets WHERE id = $1 FOR UPDATE',
        [ticketId]
      );

      if (existingRes.rows.length === 0) {
        throw AppError.notFound(`Ticket ${ticketId} not found`);
      }

      const existing = existingRes.rows[0];
      authorId = existing.author_id;

      const setClauses: string[] = ['updated_at = now()'];
      const values: unknown[] = [ticketId];

      if (updates.category !== undefined) {
        values.push(updates.category);
        setClauses.push(`category = $${values.length}`);
        setClauses.push("category_source = 'admin'");
      }

      if (updates.priority !== undefined) {
        values.push(updates.priority);
        setClauses.push(`priority = $${values.length}`);
        setClauses.push("priority_source = 'admin'");
      }

      if (updates.assignedTo !== undefined) {
        if (updates.assignedTo === 'me') {
          values.push(adminId);
          setClauses.push(`assigned_to = $${values.length}`);
        } else if (updates.assignedTo === null) {
          setClauses.push('assigned_to = NULL');
        } else {
          values.push(updates.assignedTo);
          setClauses.push(`assigned_to = $${values.length}`);
        }
      }

      if (updates.status !== undefined) {
        values.push(updates.status);
        setClauses.push(`status = $${values.length}`);
        if (updates.status !== existing.status) {
          statusChanged = true;
        }

        if (updates.status === 'Resolved' || updates.status === 'Closed') {
          setClauses.push('resolved_at = now()');
        } else if (updates.status === 'Open' || updates.status === 'In Progress') {
          setClauses.push('resolved_at = NULL');
        }
      }

      const updateSql = `
        UPDATE tickets
        SET ${setClauses.join(', ')}
        WHERE id = $1
      `;

      await client.query(updateSql, values);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    if (statusChanged) {
      publishTicketEvent(
        { authorId },
        { type: 'ticket.updated', ticketId }
      );
    }

    return this.getTicketById(ticketId);
  }

  /**
   * Admin replies to a ticket inside a single transaction:
   * - Inserts ticket_messages record
   * - If status was 'Open' -> advances to 'In Progress'
   * - If unassigned -> assigns to the replier
   * - If markResolved -> marks 'Resolved' and sets resolved_at
   * - 409 Conflict if ticket is Closed
   * - Fires ticket.reply event to author
   */
  async replyToTicket(
    ticketId: string,
    adminId: string,
    input: { body: string; markResolved?: boolean }
  ): Promise<TicketMessageResponse> {
    const client = await pool.connect();
    let authorId = '';
    let messageResult: TicketMessageResponse;

    try {
      await client.query('BEGIN');

      const ticketRes = await client.query<{
        id: string;
        author_id: string;
        status: TicketStatus;
        assigned_to: string | null;
      }>(
        'SELECT id, author_id, status, assigned_to FROM tickets WHERE id = $1 FOR UPDATE',
        [ticketId]
      );

      if (ticketRes.rows.length === 0) {
        throw AppError.notFound(`Ticket ${ticketId} not found`);
      }

      const ticket = ticketRes.rows[0];
      authorId = ticket.author_id;

      if (ticket.status === 'Closed') {
        throw new AppError(409, 'CONFLICT', 'Cannot reply to a closed ticket');
      }

      // Insert message
      const insertMsgSql = `
        INSERT INTO ticket_messages (ticket_id, sender_role, sender_id, body)
        VALUES ($1, 'admin', $2, $3)
        RETURNING id, sender_role, body, created_at::text AS created_at
      `;
      const msgRes = await client.query<TicketMessageRow>(insertMsgSql, [
        ticketId,
        adminId,
        input.body,
      ]);
      const msg = msgRes.rows[0];
      messageResult = {
        id: msg.id,
        senderRole: 'admin',
        body: msg.body,
        createdAt: msg.created_at,
      };

      // Determine ticket updates
      const updateClauses: string[] = ['updated_at = now()'];
      const values: unknown[] = [ticketId];

      if (input.markResolved) {
        updateClauses.push("status = 'Resolved'");
        updateClauses.push('resolved_at = now()');
      } else if (ticket.status === 'Open') {
        updateClauses.push("status = 'In Progress'");
      }

      if (ticket.assigned_to === null) {
        values.push(adminId);
        updateClauses.push(`assigned_to = $${values.length}`);
      }

      const updateTicketSql = `
        UPDATE tickets
        SET ${updateClauses.join(', ')}
        WHERE id = $1
      `;
      await client.query(updateTicketSql, values);

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    publishTicketEvent(
      { authorId },
      { type: 'ticket.reply', ticketId }
    );

    return messageResult;
  }

  /**
   * Adds an internal note visible only to admins.
   */
  async addInternalNote(
    ticketId: string,
    adminId: string,
    body: string
  ): Promise<AdminInternalNoteResponse> {
    const ticketCheck = await query<{ id: string }>(
      'SELECT id FROM tickets WHERE id = $1',
      [ticketId]
    );
    if (ticketCheck.length === 0) {
      throw AppError.notFound(`Ticket ${ticketId} not found`);
    }

    const insertSql = `
      INSERT INTO internal_notes (ticket_id, admin_id, body)
      VALUES ($1, $2, $3)
      RETURNING id, admin_id, body, created_at::text AS created_at
    `;
    const noteRows = await query<{
      id: string;
      admin_id: string;
      body: string;
      created_at: string;
    }>(insertSql, [ticketId, adminId, body]);
    const note = noteRows[0];

    const adminUser = await query<{ name: string }>(
      'SELECT name FROM users WHERE id = $1',
      [adminId]
    );

    return {
      id: note.id,
      adminId: note.admin_id,
      adminName: adminUser[0]?.name ?? 'Admin',
      body: note.body,
      createdAt: note.created_at,
    };
  }
}

export const adminTicketService = new AdminTicketService();
