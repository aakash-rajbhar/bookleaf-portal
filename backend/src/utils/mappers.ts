import {
  type TicketStatus,
  type TicketCategory,
  type TicketPriority,
  SLA_HOURS,
} from '../constants/ticket';

export interface BookRow {
  id: string;
  author_id: string;
  title: string;
  isbn: string;
  genre: string;
  publication_date: string | null;
  status: string;
  mrp: number | null;
  copies_sold: number;
  royalty_per_copy: number | null;
  royalty_earned: number;
  royalty_paid: number;
  royalty_pending: number;
  last_payout_date: string | null;
  print_partner: string | null;
  available_on: string[];
  author_name?: string;
}

export interface BookResponse {
  id: string;
  title: string;
  isbn: string;
  genre: string;
  publicationDate: string | null;
  status: string;
  mrp: number | null;
  copiesSold: number;
  royaltyPerCopy: number | null;
  royaltyEarned: number;
  royaltyPaid: number;
  royaltyPending: number;
  lastPayoutDate: string | null;
  printPartner: string | null;
  availableOn: string[];
  isInProduction: boolean;
  authorId?: string;
  authorName?: string;
}

/**
 * Maps database book row to camelCase API response contract.
 * Preserves SQL nulls without coercion to 0 or empty string.
 * Computes isInProduction flag.
 * Conditionally adds authorId and authorName for admin responses.
 */
export function toBookResponse(row: BookRow, isAdmin = false): BookResponse {
  const res: BookResponse = {
    id: row.id,
    title: row.title,
    isbn: row.isbn,
    genre: row.genre,
    publicationDate: row.publication_date ?? null,
    status: row.status,
    mrp: row.mrp !== null && row.mrp !== undefined ? Number(row.mrp) : null,
    copiesSold: Number(row.copies_sold ?? 0),
    royaltyPerCopy: row.royalty_per_copy !== null && row.royalty_per_copy !== undefined ? Number(row.royalty_per_copy) : null,
    royaltyEarned: Number(row.royalty_earned ?? 0),
    royaltyPaid: Number(row.royalty_paid ?? 0),
    royaltyPending: Number(row.royalty_pending ?? 0),
    lastPayoutDate: row.last_payout_date ?? null,
    printPartner: row.print_partner ?? null,
    availableOn: Array.isArray(row.available_on) ? row.available_on : [],
    isInProduction: typeof row.status === 'string' && row.status.startsWith('In Production'),
  };

  if (isAdmin) {
    res.authorId = row.author_id;
    res.authorName = row.author_name;
  }

  return res;
}

export interface TicketRow {
  id: string;
  author_id: string;
  book_id: string | null;
  book_title?: string | null;
  subject: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TicketMessageRow {
  id: string;
  sender_role: 'author' | 'admin';
  body: string;
  created_at: string;
}

export interface TicketMessageResponse {
  id: string;
  senderRole: 'author' | 'admin';
  body: string;
  createdAt: string;
}

export interface AuthorTicketResponse {
  id: string;
  subject: string;
  description: string;
  status: string;
  bookId: string | null;
  bookTitle: string | null;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessageResponse[];
}

/**
 * Author-facing ticket shape:
 * { id, subject, description, status, bookId, bookTitle, createdAt, updatedAt, messages }
 * Omits internal fields: category, priority, *_source, ai_status, ai_reason, assigned_to, internal notes.
 */
export function toAuthorTicketResponse(
  row: TicketRow,
  messages: TicketMessageRow[] = []
): AuthorTicketResponse {
  return {
    id: row.id,
    subject: row.subject,
    description: row.description,
    status: row.status,
    bookId: row.book_id ?? null,
    bookTitle: row.book_title ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    messages: messages.map((m) => ({
      id: m.id,
      senderRole: m.sender_role,
      body: m.body,
      createdAt: m.created_at,
    })),
  };
}

export interface AdminTicketRow {
  id: string;
  author_id: string;
  author_name: string;
  author_email?: string;
  author_city?: string;
  book_id: string | null;
  book_title: string | null;
  subject: string;
  description?: string;
  status: TicketStatus;
  category: TicketCategory | null;
  category_source: string | null;
  priority: TicketPriority | null;
  priority_source: string | null;
  ai_status: string;
  ai_reason?: string | null;
  assigned_to: string | null;
  assigned_to_name?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
}

export interface AdminTicketItemResponse {
  id: string;
  subject: string;
  status: TicketStatus;
  category: TicketCategory | null;
  categorySource: string | null;
  priority: TicketPriority | null;
  prioritySource: string | null;
  aiStatus: string;
  authorId: string;
  authorName: string;
  bookId: string | null;
  bookTitle: string | null;
  assignedTo: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
  ageHours: number;
  isOverdue: boolean;
}

export interface AdminInternalNoteResponse {
  id: string;
  adminId: string;
  adminName: string;
  body: string;
  createdAt: string;
}

export interface AdminDraftResponse {
  id: string;
  draftText: string;
  model: string | null;
  source: 'ai' | 'template';
  createdAt: string;
}

export interface AdminTicketDetailResponse {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  category: TicketCategory | null;
  categorySource: string | null;
  priority: TicketPriority | null;
  prioritySource: string | null;
  aiStatus: string;
  aiReason: string | null;
  authorId: string;
  authorName: string;
  bookId: string | null;
  bookTitle: string | null;
  assignedTo: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  ageHours: number;
  isOverdue: boolean;
  author: {
    id: string;
    name: string;
    email: string;
    city: string;
  };
  book: BookResponse | null;
  messages: TicketMessageResponse[];
  internalNotes: AdminInternalNoteResponse[];
  latestDraft: AdminDraftResponse | null;
}

export function computeAgeHours(createdAt: string): number {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  return Math.max(0, Math.round((diffMs / 3600000) * 10) / 10);
}

export function computeIsOverdue(
  status: string,
  priority: TicketPriority | null,
  ageHours: number
): boolean {
  const isUnresolved = status === 'Open' || status === 'In Progress';
  const effectivePriority = priority ?? 'Medium';
  const slaLimit = SLA_HOURS[effectivePriority] ?? 96;
  return isUnresolved && ageHours > slaLimit;
}

export function toAdminTicketItemResponse(row: AdminTicketRow): AdminTicketItemResponse {
  const ageHours = computeAgeHours(row.created_at);
  const isOverdue = computeIsOverdue(row.status, row.priority, ageHours);

  return {
    id: row.id,
    subject: row.subject,
    status: row.status,
    category: row.category,
    categorySource: row.category_source,
    priority: row.priority,
    prioritySource: row.priority_source,
    aiStatus: row.ai_status,
    authorId: row.author_id,
    authorName: row.author_name,
    bookId: row.book_id ?? null,
    bookTitle: row.book_title ?? null,
    assignedTo:
      row.assigned_to && row.assigned_to_name
        ? { id: row.assigned_to, name: row.assigned_to_name }
        : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ageHours,
    isOverdue,
  };
}
