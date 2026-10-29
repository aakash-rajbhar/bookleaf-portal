import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TicketCategory,
  TicketPriority,
} from '../constants/ticket';

export interface FallbackTriageResult {
  category: TicketCategory;
  priority: TicketPriority;
  reason: 'rule-based fallback';
}

/**
 * Pure function rule-based fallback classifier.
 * Evaluates ordered keyword rules case-insensitively:
 * 1. ISBN first -> 'ISBN & Metadata Issues', Priority High
 * 2. Printing (blurry, misprint, binding, torn, quality) -> 'Printing & Quality', Priority High
 * 3. Distribution (unavailable, not showing, listing, amazon, flipkart) -> 'Distribution & Availability', Priority High
 * 4. Royalty (royalty, payment, payout, paid, earnings) -> 'Royalty & Payments',
 *    Priority High if (months|never received|still haven't|not received), else Medium
 * 5. Production (status, typesetting, cover, proofreading, when will) -> 'Book Status & Production Updates', Priority Medium
 * 6. Else General Inquiry -> 'General Inquiry', Priority Low if (bio|description|update|change), else Medium
 */
export function fallbackClassifier(
  subject: string,
  description: string
): FallbackTriageResult {
  const text = `${subject} ${description}`.toLowerCase();

  // 1. ISBN first -> High
  if (
    text.includes('isbn') ||
    text.includes('barcode') ||
    text.includes('metadata') ||
    text.includes('imprint')
  ) {
    return {
      category: 'ISBN & Metadata Issues',
      priority: 'High',
      reason: 'rule-based fallback',
    };
  }

  // 2. Printing (blurry, misprint, binding, torn, quality) -> High
  if (
    text.includes('blurry') ||
    text.includes('misprint') ||
    text.includes('binding') ||
    text.includes('torn') ||
    text.includes('quality') ||
    text.includes('print')
  ) {
    return {
      category: 'Printing & Quality',
      priority: 'High',
      reason: 'rule-based fallback',
    };
  }

  // 3. Distribution (unavailable, not showing, listing, amazon, flipkart) -> High
  const hasListingIssue =
    text.includes('unavailable') ||
    text.includes('not showing') ||
    text.includes('out of stock') ||
    text.includes('delisted') ||
    text.includes('listing') ||
    text.includes('stock');

  const isRetailerWithoutBioUpdate =
    (text.includes('amazon') || text.includes('flipkart')) &&
    !text.includes('bio') &&
    !text.includes('description');

  if (hasListingIssue || isRetailerWithoutBioUpdate) {
    return {
      category: 'Distribution & Availability',
      priority: 'High',
      reason: 'rule-based fallback',
    };
  }

  // 4. Royalty (royalty, payment, payout, paid, earnings)
  if (
    text.includes('royalty') ||
    text.includes('payment') ||
    text.includes('payout') ||
    text.includes('paid') ||
    text.includes('earnings')
  ) {
    const isHigh =
      text.includes('months') ||
      text.includes('never received') ||
      text.includes("still haven't") ||
      text.includes('still havent') ||
      text.includes('not received') ||
      text.includes('overdue');

    const isCritical =
      text.includes('3 months') ||
      text.includes('4 months') ||
      text.includes('5 months') ||
      text.includes('6 months');

    return {
      category: 'Royalty & Payments',
      priority: isCritical ? 'Critical' : isHigh ? 'High' : 'Medium',
      reason: 'rule-based fallback',
    };
  }

  // 5. Production (status, typesetting, cover, proofreading, when will) -> Medium
  const isProduction =
    text.includes('typesetting') ||
    text.includes('proofreading') ||
    (text.includes('cover') && !text.includes('description')) ||
    text.includes('when will') ||
    text.includes('editing') ||
    text.includes('stage') ||
    (text.includes('status') && !text.includes('royalty') && !text.includes('stock'));

  if (isProduction) {
    return {
      category: 'Book Status & Production Updates',
      priority: 'Medium',
      reason: 'rule-based fallback',
    };
  }

  // 6. Else General
  const isLow =
    text.includes('bio') ||
    text.includes('description') ||
    text.includes('update') ||
    text.includes('change');

  return {
    category: 'General Inquiry',
    priority: isLow ? 'Low' : 'Medium',
    reason: 'rule-based fallback',
  };
}
