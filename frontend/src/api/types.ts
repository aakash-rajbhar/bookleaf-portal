export type UserRole = 'author' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  authorId: string | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CurrentUserResponse {
  user: User;
}

export const TICKET_STATUSES = [
  'Open',
  'In Progress',
  'Resolved',
  'Closed',
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_CATEGORIES = [
  'Royalty & Payments',
  'ISBN & Metadata',
  'Printing & Quality',
  'Distribution',
  'Production Updates',
  'General',
] as const;

export type TicketCategory = (typeof TICKET_CATEGORIES)[number];

export const TICKET_PRIORITIES = [
  'Critical',
  'High',
  'Medium',
  'Low',
] as const;

export type TicketPriority = (typeof TICKET_PRIORITIES)[number];


export interface Book {
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
  // Admin-only fields returned conditionally
  authorId?: string;
  authorName?: string;
}

export interface TicketMessage {
  id: string;
  senderRole: 'author' | 'admin';
  body: string;
  createdAt: string;
}

export interface AuthorTicket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  bookId: string | null;
  bookTitle: string | null;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

export interface CreateTicketInput {
  bookId?: string | null;
  subject: string;
  description: string;
}

export interface StreamTokenResponse {
  streamToken: string;
  expiresInSeconds: number;
}

// Admin-specific types (reserved for T13)
export interface AdminTicketItem {
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

export interface AdminTicketListResponse {
  items: AdminTicketItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminInternalNote {
  id: string;
  adminId: string;
  adminName: string;
  body: string;
  createdAt: string;
}

export interface AdminDraft {
  id: string;
  draftText: string;
  model: string | null;
  source: 'ai' | 'template';
  createdAt: string;
}

export interface AdminTicketDetail {
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
  book: Book | null;
  messages: TicketMessage[];
  internalNotes: AdminInternalNote[];
  latestDraft: AdminDraft | null;
}

export interface DraftResponse {
  text: string;
  source: 'ai' | 'template';
  model: string | null;
  createdAt: string;
  cached: boolean;
  reason?: string;
}

export interface PatchTicketInput {
  status?: TicketStatus;
  category?: TicketCategory;
  priority?: TicketPriority;
  assignedTo?: 'me' | string | null;
}

export interface ReplyTicketInput {
  body: string;
  markResolved?: boolean;
}

export interface AddNoteInput {
  body: string;
}

export interface RetryTriageResponse {
  message: string;
  ticketId: string;
}

export interface ApiErrorDetail {
  path: string;
  message: string;
}

export interface ApiErrorShape {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[] | unknown;
  };
}
