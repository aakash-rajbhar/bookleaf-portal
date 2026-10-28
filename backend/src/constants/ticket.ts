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

export const PRIORITY_RANK: Record<TicketPriority, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

export const SLA_HOURS: Record<TicketPriority, number> = {
  Critical: 24,
  High: 48,
  Medium: 96,
  Low: 168,
};
