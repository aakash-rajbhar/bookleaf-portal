/**
 * Overdue threshold in days:
 * BookLeaf pays royalties within 45 days of calendar-quarter end (a 90-day cycle + 45 days = 135 days max latency).
 * If more than 135 days have passed since publication or the last payout with unpaid royalties >= 1,000,
 * it is assumed overdue. (Documented in DECISIONS.md as an engineering assumption).
 */
export const OVERDUE_DAYS_THRESHOLD = 135;

/**
 * Minimum accumulated royalty payout threshold in INR.
 * Amounts below this roll over to the next quarter.
 */
export const ROYALTY_MIN_PAYOUT_THRESHOLD = 1000;

/**
 * Calendar-quarter payout settlement window in days (BookLeaf policy: paid within 45 days of quarter end).
 */
export const PAYOUT_WINDOW_DAYS_AFTER_QUARTER = 45;

export interface BookFactInput {
  title?: string;
  status?: string;
  publicationDate?: string | null;
  publication_date?: string | null;
  mrp?: number | null;
  copiesSold?: number | null;
  copies_sold?: number | null;
  total_copies_sold?: number | null;
  royaltyEarned?: number | null;
  royalty_earned?: number | null;
  total_royalty_earned?: number | null;
  royaltyPaid?: number | null;
  royalty_paid?: number | null;
  royaltyPending?: number | null;
  royalty_pending?: number | null;
  lastPayoutDate?: string | null;
  last_payout_date?: string | null;
  last_royalty_payout_date?: string | null;
  printPartner?: string | null;
  print_partner?: string | null;
  availableOn?: string[] | null;
  available_on?: string[] | null;
}

export interface BookFacts {
  title: string;
  status: string;
  inProduction: boolean;
  productionStage: string | null;
  mrp: number | null;
  copiesSold: number;
  royaltyEarned: number | null;
  royaltyPaid: number | null;
  royaltyPending: number | null;
  lastPayoutDate: string | null;
  neverPaid: boolean;
  pendingBelowThreshold: boolean;
  rollsOver: boolean;
  platforms: string[];
  printPartner: string | null;
  daysSinceReference: number | null;
  likelyOverdue: boolean;
  nextPayoutDeadline: string | null;
}

/**
 * Computes the earliest calendar-quarter end + 45 days that is >= now.
 * Calendar quarters end on: Mar 31, Jun 30, Sep 30, Dec 31.
 * Returns date in ISO format YYYY-MM-DD.
 */
export function computeNextPayoutDeadline(now: Date): string {
  const currentYear = now.getUTCFullYear();
  const nowDateStr = now.toISOString().slice(0, 10);

  // Check quarters from previous year to next year to ensure boundary coverage
  const candidateYears = [currentYear - 1, currentYear, currentYear + 1];
  const deadlines: string[] = [];

  for (const year of candidateYears) {
    // Q1: Mar 31 -> + 45 days
    const q1End = new Date(Date.UTC(year, 2, 31));
    const q1Deadline = new Date(q1End.getTime() + PAYOUT_WINDOW_DAYS_AFTER_QUARTER * 86400000);
    deadlines.push(q1Deadline.toISOString().slice(0, 10));

    // Q2: Jun 30 -> + 45 days
    const q2End = new Date(Date.UTC(year, 5, 30));
    const q2Deadline = new Date(q2End.getTime() + PAYOUT_WINDOW_DAYS_AFTER_QUARTER * 86400000);
    deadlines.push(q2Deadline.toISOString().slice(0, 10));

    // Q3: Sep 30 -> + 45 days
    const q3End = new Date(Date.UTC(year, 8, 30));
    const q3Deadline = new Date(q3End.getTime() + PAYOUT_WINDOW_DAYS_AFTER_QUARTER * 86400000);
    deadlines.push(q3Deadline.toISOString().slice(0, 10));

    // Q4: Dec 31 -> + 45 days
    const q4End = new Date(Date.UTC(year, 11, 31));
    const q4Deadline = new Date(q4End.getTime() + PAYOUT_WINDOW_DAYS_AFTER_QUARTER * 86400000);
    deadlines.push(q4Deadline.toISOString().slice(0, 10));
  }

  deadlines.sort();

  for (const deadline of deadlines) {
    if (deadline >= nowDateStr) {
      return deadline;
    }
  }

  // Fallback to the last candidate if all were earlier
  return deadlines[deadlines.length - 1];
}

/**
 * Pure function computing book facts in code (deterministic, testable, no DB/LLM calls).
 * Returns null for General tickets (where no book is linked).
 */
export function computeBookFacts(
  book: BookFactInput | null | undefined,
  now: Date = new Date()
): BookFacts | null {
  if (!book || !book.title) {
    return null;
  }

  const title = book.title;
  const status = book.status ?? 'Unknown';
  const inProduction = status.startsWith('In Production');

  let productionStage: string | null = null;
  if (inProduction) {
    if (status.includes(' - ')) {
      productionStage = status.split(' - ').slice(1).join(' - ').trim();
    } else {
      productionStage = status;
    }
  }

  const platforms = Array.isArray(book.availableOn)
    ? book.availableOn
    : Array.isArray(book.available_on)
    ? book.available_on
    : [];

  const printPartner = book.printPartner ?? book.print_partner ?? null;

  if (inProduction) {
    return {
      title,
      status,
      inProduction: true,
      productionStage,
      mrp: null,
      copiesSold: 0,
      royaltyEarned: null,
      royaltyPaid: null,
      royaltyPending: null,
      lastPayoutDate: null,
      neverPaid: false,
      pendingBelowThreshold: false,
      rollsOver: false,
      platforms,
      printPartner,
      daysSinceReference: null,
      likelyOverdue: false,
      nextPayoutDeadline: null,
    };
  }

  const mrp = book.mrp !== undefined && book.mrp !== null ? Number(book.mrp) : null;
  const copiesSold = Number(
    book.copiesSold ?? book.copies_sold ?? book.total_copies_sold ?? 0
  );

  const rawEarned = book.royaltyEarned ?? book.royalty_earned ?? book.total_royalty_earned;
  const rawPaid = book.royaltyPaid ?? book.royalty_paid;
  const rawPending = book.royaltyPending ?? book.royalty_pending;

  const royaltyFieldsAreNull =
    (rawEarned === undefined || rawEarned === null) &&
    (rawPaid === undefined || rawPaid === null) &&
    (rawPending === undefined || rawPending === null);

  const royaltyEarned =
    rawEarned !== undefined && rawEarned !== null ? Number(rawEarned) : null;
  const royaltyPaid =
    rawPaid !== undefined && rawPaid !== null ? Number(rawPaid) : null;
  const royaltyPending =
    rawPending !== undefined && rawPending !== null ? Number(rawPending) : null;

  const lastPayoutDate =
    book.lastPayoutDate ?? book.last_payout_date ?? book.last_royalty_payout_date ?? null;
  const publicationDate = book.publicationDate ?? book.publication_date ?? null;

  const neverPaid = (royaltyPaid === 0 || royaltyPaid === null) && !lastPayoutDate;
  const pendingBelowThreshold =
    royaltyPending !== null ? royaltyPending < ROYALTY_MIN_PAYOUT_THRESHOLD : false;
  const rollsOver = pendingBelowThreshold;

  const referenceDateStr = lastPayoutDate ?? publicationDate;
  let daysSinceReference: number | null = null;

  if (referenceDateStr) {
    const refMs = new Date(referenceDateStr).getTime();
    if (!Number.isNaN(refMs)) {
      const diffMs = now.getTime() - refMs;
      daysSinceReference = Math.max(0, Math.floor(diffMs / 86400000));
    }
  }

  const likelyOverdue =
    royaltyPending !== null &&
    royaltyPending >= ROYALTY_MIN_PAYOUT_THRESHOLD &&
    daysSinceReference !== null &&
    daysSinceReference > OVERDUE_DAYS_THRESHOLD;

  let nextPayoutDeadline: string | null = null;
  if (!pendingBelowThreshold && !royaltyFieldsAreNull && royaltyPending !== null) {
    nextPayoutDeadline = computeNextPayoutDeadline(now);
  }

  return {
    title,
    status,
    inProduction: false,
    productionStage: null,
    mrp,
    copiesSold,
    royaltyEarned,
    royaltyPaid,
    royaltyPending,
    lastPayoutDate,
    neverPaid,
    pendingBelowThreshold,
    rollsOver,
    platforms,
    printPartner,
    daysSinceReference,
    likelyOverdue,
    nextPayoutDeadline,
  };
}
