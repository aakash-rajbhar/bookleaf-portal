import { TicketCategory } from '../constants/ticket';

export const KB_COMPANY = `[Company Overview]
- BookLeaf Publishing: self-publishing company in India and the US.
- Packages: Standard Free (no upfront cost) and Bestseller Breakthrough (premium, paid, marketing and distribution add-ons).
- Handles cover design, typesetting, ISBN assignment, printing, distribution, royalty management.
- In-house printing facility and warehouse in Delhi. Print partners: Repro India, Epitome Books.`;

export const KB_ROYALTY = `[Royalty Policy]
- 80/20 split: 80% of net profit per book to author, 20% to BookLeaf.
- Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart), and shipping charges.
- Royalties calculated quarterly and paid within 45 days of quarter end.
- Minimum payout threshold: Rs 1,000. Below that, accumulated royalties roll over to the next quarter.
- Payouts by bank transfer to the account linked in the author's dashboard.
- Authors can view a detailed royalty breakdown in their dashboard with sales per platform.`;

export const KB_ISBN = `[ISBN & Metadata Policy]
- Every book gets a unique ISBN assigned by BookLeaf, registered under BookLeaf's publisher imprint.
- Author wanting an ISBN under their own imprint must obtain it independently.
- ISBN error reports (duplicate, wrong book linked) are HIGH priority and escalated to the production team.`;

export const KB_PRINTING = `[Printing & Quality Policy]
- In-house printing handles most orders. Overflow / special formats go to Repro India or Epitome Books.
- Standard print turnaround: 5-7 business days from order confirmation.
- Quality issues (misprints, binding defects, colour inconsistency): free reprint after verification. Author may need to share photos of the defective copy.`;

export const KB_DISTRIBUTION = `[Distribution & Availability Policy]
- Listed on Amazon India, Flipkart, Amazon US, Amazon UK, BookLeaf Store.
- New listings typically go live 7-10 business days after publication is complete.
- "Unavailable" on a platform usually = stock sync issue; BookLeaf can trigger a re-sync within 24-48 hours.`;

export const KB_PRODUCTION = `[Production & Book Status Policy]
- Stages: Manuscript Received -> Editing (if opted) -> Cover Design -> Typesetting -> Proofreading -> ISBN Assignment -> Printing -> Distribution Setup -> Published & Live.
- Authors are emailed at each stage. Delays typically happen at Cover Design (waiting for author approval) and Proofreading (revision rounds).`;

export const KB_TONE = `[Tone & Style Guidelines]
- Always empathetic and professional. Authors are partners, not customers to be managed.
- Acknowledge the concern before jumping to solutions.
- Be specific: actual numbers, dates, statuses rather than vague reassurance.
- If it is BookLeaf's fault (delayed royalties, ISBN error), own it directly. No corporate deflection.
- If escalation/investigation is needed, give a clear timeline ("Our team will look into this and get back to you within 48 hours"), not open-ended promises.
- Always end with a clear next step for the author and/or BookLeaf team.`;

export const KB_EXAMPLES: Record<TicketCategory, string> = {
  'Royalty & Payments': `[Example Response Guidelines]
- Query: Published 4 months ago, no royalty yet
  Expected response: Acknowledge frustration. Explain quarterly cycle + 45-day window. Check bank details linked. Give specific next payout date. If genuinely overdue, escalate with 48-hour timeline.
- Query: Sold 200 copies but only got Rs 3,000
  Expected response: Explain net profit calc (MRP - printing - platform commission - shipping). Offer line-by-line breakdown. Not defensive; transparent.`,

  'ISBN & Metadata': `[Example Response Guidelines]
- Query: Amazon shows different ISBN than physical copy
  Expected response: High priority. Serious data issue. Confirm escalation to production team immediately. 48-hour timeline.`,

  'Printing & Quality': `[Example Response Guidelines]
- Query: Author copies blurry, pages misaligned
  Expected response: Apologise sincerely. Ask for photos. Confirm free reprint once verified. 5-7 business days for reprint.`,

  Distribution: `[Example Response Guidelines]
- Query: Shows "Currently Unavailable" on Amazon
  Expected response: Typically stock sync issue. Confirm re-sync triggered with distribution team. 24-48 hours.`,

  'Production Updates': `[Example Response Guidelines]
- Query: 3 weeks in typesetting, when done?
  Expected response: Check actual status. If delayed, be honest about why (e.g. waiting on author approval). Give specific updated timeline. Don't blame author; frame collaboratively.`,

  General: `[Example Response Guidelines]
- Query: Can I update description on Amazon after live?
  Expected response: Yes, via dashboard or emailing BookLeaf team. Changes reflect on platforms within 3-5 business days.`,
};

export const CATEGORY_SECTIONS: Record<TicketCategory, string> = {
  'Royalty & Payments': KB_ROYALTY,
  'ISBN & Metadata': KB_ISBN,
  'Printing & Quality': KB_PRINTING,
  Distribution: KB_DISTRIBUTION,
  'Production Updates': KB_PRODUCTION,
  General: KB_COMPANY,
};

/**
 * Builds a strictly sliced knowledge base context for a ticket category.
 * Slices contain ONLY:
 * 1. Tone guidelines
 * 2. The category's specific knowledge section
 * 3. The category's specific example entry
 *
 * Never returns the full KB to preserve prompt token budget and prevent policy hallucination.
 * Defaults to 'General' if category is null/undefined/unrecognized.
 */
export function buildKnowledgeContext(category?: TicketCategory | null | string): string {
  const effectiveCategory: TicketCategory =
    category && category in CATEGORY_SECTIONS
      ? (category as TicketCategory)
      : 'General';

  const section = CATEGORY_SECTIONS[effectiveCategory];
  const example = KB_EXAMPLES[effectiveCategory];

  return [KB_TONE, section, example].filter(Boolean).join('\n\n');
}
