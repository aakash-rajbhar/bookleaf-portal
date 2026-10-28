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
