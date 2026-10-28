import { query } from '../db/pool';
import { AppError } from '../utils/errors';
import { TicketCategory } from '../constants/ticket';
import { computeBookFacts } from '../ai/bookFacts';
import { buildDraftPrompt, DRAFT_SYSTEM_PROMPT } from '../ai/prompts/draft';
import { fallbackDraft } from '../ai/fallbackDraft';
import { getProvider } from '../ai';
import { AIUnavailableError } from '../ai/errors';
import { logAiCall } from '../db/aiUsageLog';
import { BookRow } from '../utils/mappers';

export interface GenerateDraftOptions {
  regenerate?: boolean;
}

export interface DraftResponse {
  text: string;
  source: 'ai' | 'template';
  model: string | null;
  createdAt: string;
  cached: boolean;
  reason?: string;
}

export class DraftService {
  /**
   * Generates or retrieves a cached AI-assisted response draft for a ticket.
   *
   * Flow:
   * 1. Loads ticket, author, book (if any), and last 3 messages. 404 if missing.
   * 2. If not regenerate and a draft exists, returns the latest draft with cached: true.
   *    Makes zero provider calls and writes zero usage log records.
   * 3. Otherwise, computes book facts in code, slices the KB, and invokes LLMProvider.generateText.
   *    On AIUnavailableError (or empty/short result), generates a grounded template fallback.
   * 4. Persists the draft in ai_drafts with source ('ai' | 'template') and logs AI usage telemetry.
   * 5. Returns { text, source, model, createdAt, cached, reason? }.
   */
  async generate(
    ticketId: string,
    options: GenerateDraftOptions = {}
  ): Promise<DraftResponse> {
    const regenerate = Boolean(options.regenerate);

    // 1. Load ticket and author
    const ticketSql = `
      SELECT
        t.id,
        t.author_id,
        t.book_id,
        t.subject,
        t.description,
        t.category,
        t.status,
        a.name AS author_name,
        a.email AS author_email
      FROM tickets t
      JOIN authors a ON a.id = t.author_id
      WHERE t.id = $1
    `;
    const ticketRows = await query<{
      id: string;
      author_id: string;
      book_id: string | null;
      subject: string;
      description: string;
      category: TicketCategory | null;
      status: string;
      author_name: string;
      author_email: string;
    }>(ticketSql, [ticketId]);

    if (ticketRows.length === 0) {
      throw AppError.notFound(`Ticket ${ticketId} not found`);
    }

    const ticket = ticketRows[0];

    // Load book if linked to ticket
    let book: BookRow | null = null;
    if (ticket.book_id) {
      const bookSql = `
        SELECT
          id, author_id, title, isbn, genre, publication_date::text AS publication_date,
          status, mrp, copies_sold, royalty_per_copy, royalty_earned, royalty_paid,
          royalty_pending, last_payout_date::text AS last_payout_date,
          print_partner, available_on
        FROM books
        WHERE id = $1
      `;
      const bookRows = await query<BookRow>(bookSql, [ticket.book_id]);
      if (bookRows.length > 0) {
        book = bookRows[0];
      }
    }

    // Load at most the last 3 messages for context
    const msgSql = `
      SELECT sender_role, body, created_at::text AS created_at
      FROM ticket_messages
      WHERE ticket_id = $1
      ORDER BY created_at DESC
      LIMIT 3
    `;
    const msgRows = await query<{
      sender_role: 'author' | 'admin';
      body: string;
      created_at: string;
    }>(msgSql, [ticketId]);
    const messages = msgRows.reverse();

    // 2. Check for existing cached draft if regenerate is false
    if (!regenerate) {
      const existingDraftSql = `
        SELECT id, draft_text, model, source, created_at::text AS created_at
        FROM ai_drafts
        WHERE ticket_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const existingRows = await query<{
        id: string;
        draft_text: string;
        model: string | null;
        source: 'ai' | 'template';
        created_at: string;
      }>(existingDraftSql, [ticketId]);

      if (existingRows.length > 0) {
        const cachedDraft = existingRows[0];
        return {
          text: cachedDraft.draft_text,
          source: cachedDraft.source,
          model: cachedDraft.model,
          createdAt: cachedDraft.created_at,
          cached: true,
        };
      }
    }

    // 3. Compute facts and build grounded prompt
    const facts = computeBookFacts(book, new Date());
    const prompt = buildDraftPrompt({
      ticket: {
        subject: ticket.subject,
        description: ticket.description,
      },
      authorName: ticket.author_name,
      category: ticket.category,
      bookFacts: facts,
      messages: messages.map((m) => ({
        senderRole: m.sender_role,
        body: m.body,
      })),
    });

    const provider = getProvider();
    const startMs = Date.now();
    let draftText: string;
    let source: 'ai' | 'template' = 'ai';
    let model: string | null = provider.model;
    let promptTokens = 0;
    let completionTokens = 0;
    let latencyMs = 0;
    let failureReason: string | undefined = undefined;

    try {
      const res = await provider.generateText({
        system: DRAFT_SYSTEM_PROMPT,
        prompt,
        maxOutputTokens: 600,
      });

      latencyMs = res.usage.latencyMs;
      promptTokens = res.usage.promptTokens;
      completionTokens = res.usage.completionTokens;
      model = res.usage.model;

      // Treat empty or very short response as failure for upstream providers
      const isTooShort =
        provider.name === 'mock'
          ? res.text.trim().length === 0
          : res.text.trim().length < 20;

      if (!res.text || isTooShort) {
        throw new AIUnavailableError(
          'invalid_output',
          'AI returned empty or overly short draft'
        );
      }

      draftText = res.text.trim();

      await logAiCall({
        ticketId,
        task: 'draft',
        model,
        promptTokens,
        completionTokens,
        latencyMs,
        success: true,
      });
    } catch (err: unknown) {
      latencyMs = Date.now() - startMs;
      failureReason =
        err instanceof AIUnavailableError
          ? err.reason
          : err instanceof Error
          ? err.message
          : 'upstream';

      source = 'template';
      model = null;

      draftText = fallbackDraft({
        category: ticket.category,
        authorName: ticket.author_name,
        facts,
        ticket: {
          subject: ticket.subject,
          description: ticket.description,
        },
      });

      await logAiCall({
        ticketId,
        task: 'draft',
        model: provider.model,
        promptTokens: 0,
        completionTokens: 0,
        latencyMs,
        success: false,
        error: failureReason,
      });
    }

    // 4. Persist in ai_drafts
    const insertDraftSql = `
      INSERT INTO ai_drafts (
        ticket_id,
        draft_text,
        model,
        source,
        prompt_tokens,
        completion_tokens,
        latency_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, draft_text, model, source, created_at::text AS created_at
    `;
    const insertRows = await query<{
      id: string;
      draft_text: string;
      model: string | null;
      source: 'ai' | 'template';
      created_at: string;
    }>(insertDraftSql, [
      ticketId,
      draftText,
      model,
      source,
      promptTokens,
      completionTokens,
      latencyMs,
    ]);

    const saved = insertRows[0];

    // 5. Return structured response
    return {
      text: saved.draft_text,
      source: saved.source,
      model: saved.model,
      createdAt: saved.created_at,
      cached: false,
      ...(failureReason ? { reason: failureReason } : {}),
    };
  }
}

export const draftService = new DraftService();
