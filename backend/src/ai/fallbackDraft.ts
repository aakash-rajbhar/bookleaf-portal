import { TicketCategory } from '../constants/ticket';
import { BookFacts } from './bookFacts';

export interface FallbackDraftInput {
  category?: TicketCategory | null;
  authorName?: string;
  facts: BookFacts | null;
  ticket: {
    subject: string;
    description: string;
  };
}

/**
 * Pure function returning a deterministic template draft grounded in the same
 * author facts, KB tone, timelines, and next steps as the LLM prompt.
 * Used whenever the AI provider is unavailable (rate limit, outage, mock failure).
 */
export function fallbackDraft(input: FallbackDraftInput): string {
  const firstName = input.authorName?.trim().split(/\s+/)[0] || 'there';
  const category = input.category ?? 'General';
  const facts = input.facts;

  switch (category) {
    case 'Royalty & Payments': {
      if (facts?.inProduction) {
        return (
          `Hello ${firstName},\n\n` +
          `Thank you for reaching out regarding "${facts.title}". Your book is currently in the ${facts.productionStage ?? 'production'} stage. Royalties only apply once your book is published and live. We will continue to keep you updated as production progresses.\n\n` +
          `Warm regards,\n` +
          `BookLeaf Support Team`
        );
      }

      if (facts?.likelyOverdue) {
        return (
          `Hello ${firstName},\n\n` +
          `Thank you for reaching out to BookLeaf Support. I understand your concern regarding the pending royalty payment of Rs ${(facts.royaltyPending ?? 0).toLocaleString('en-IN')} for "${facts.title}".\n\n` +
          `This delay is on our end, and we sincerely apologize for the inconvenience. I have escalated this issue directly to our finance team for immediate investigation. We will verify your bank details and get back to you with a resolution within 48 hours.\n\n` +
          `Please ensure your payout details in the author dashboard are up to date.\n\n` +
          `Warm regards,\n` +
          `BookLeaf Support Team`
        );
      }

      if (facts?.pendingBelowThreshold) {
        return (
          `Hello ${firstName},\n\n` +
          `Thank you for reaching out. Regarding "${facts.title}", your current pending royalty balance is Rs ${(facts.royaltyPending ?? 0).toLocaleString('en-IN')}.\n\n` +
          `Under BookLeaf policy, our minimum payout threshold is Rs 1,000. Balances below this amount roll over to the next quarterly payout cycle, scheduled for ${facts.nextPayoutDeadline}.\n\n` +
          `You can view your detailed sales breakdown anytime on your author dashboard. Please let us know if you have any questions.\n\n` +
          `Warm regards,\n` +
          `BookLeaf Support Team`
        );
      }

      return (
        `Hello ${firstName},\n\n` +
        `Thank you for contacting BookLeaf Support regarding your royalties${facts ? ` for "${facts.title}"` : ''}.\n\n` +
        `Our records show ${facts ? `Rs ${(facts.royaltyPaid ?? 0).toLocaleString('en-IN')} paid to date and Rs ${(facts.royaltyPending ?? 0).toLocaleString('en-IN')} currently pending` : 'that your royalty inquiry has been received'}. Royalties are calculated quarterly and distributed within 45 days of quarter end. Our finance team will review your account and follow up within 48 hours.\n\n` +
        `Warm regards,\n` +
        `BookLeaf Support Team`
      );
    }

    case 'ISBN & Metadata':
      return (
        `Hello ${firstName},\n\n` +
        `Thank you for bringing this ISBN and metadata issue to our attention${facts ? ` regarding "${facts.title}"` : ''}.\n\n` +
        `We treat catalog metadata integrity as a high priority. I have escalated this issue directly to our production team for immediate investigation. We will verify the registry records and update you within 48 hours.\n\n` +
        `Thank you for your patience while we resolve this.\n\n` +
        `Warm regards,\n` +
        `BookLeaf Support Team`
      );

    case 'Printing & Quality':
      return (
        `Hello ${firstName},\n\n` +
        `Thank you for contacting BookLeaf Support. We are very sorry to hear about the print quality issue with your copies${facts ? ` of "${facts.title}"` : ''}.\n\n` +
        `BookLeaf provides free reprints for verified defects. Please reply to this email with clear photographs showing the misprint or binding issue so our quality team can inspect it. Once verified, we will arrange a replacement copy within 5 to 7 business days.\n\n` +
        `Warm regards,\n` +
        `BookLeaf Support Team`
      );

    case 'Distribution':
      return (
        `Hello ${firstName},\n\n` +
        `Thank you for reaching out regarding the distribution availability${facts ? ` of "${facts.title}"` : ''}.\n\n` +
        `Online listings can occasionally experience stock synchronization delays across retail partners. Our distribution team will trigger a catalog re-sync with the platforms within 24 to 48 hours.\n\n` +
        `We are monitoring the listing and will follow up as soon as it reflects online.\n\n` +
        `Warm regards,\n` +
        `BookLeaf Support Team`
      );

    case 'Production Updates':
      return (
        `Hello ${firstName},\n\n` +
        `Thank you for checking in on the production progress of "${facts?.title ?? 'your book'}".\n\n` +
        `Your book is currently in the ${facts?.productionStage ?? 'production'} stage. Our publishing team is actively working on it. We will review the exact status and provide you with an updated timeline within 48 hours.\n\n` +
        `Please feel free to reach out if you have any questions in the meantime.\n\n` +
        `Warm regards,\n` +
        `BookLeaf Support Team`
      );

    case 'General':
    default:
      return (
        `Hello ${firstName},\n\n` +
        `Thank you for reaching out to BookLeaf Support regarding "${input.ticket.subject}".\n\n` +
        `A member of our support team is reviewing your request and will follow up with complete details within 48 hours.\n\n` +
        `Please let us know if there is any additional information you would like to share in the meantime.\n\n` +
        `Warm regards,\n` +
        `BookLeaf Support Team`
      );
  }
}
