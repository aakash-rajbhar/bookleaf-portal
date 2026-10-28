import { sseHub, type HubEvent } from '../sse/hub';

export interface EventTarget {
  authorId?: string;
  admins?: boolean;
}

export type TicketEvent = HubEvent;

/**
 * Publishes real-time ticket events to target streams via the SSE Hub:
 * - authorId maps to "author:<authorId>" channel
 * - admins maps to "admins" channel
 */
export function publishTicketEvent(
  target: EventTarget,
  event: TicketEvent
): void {
  if (target.authorId) {
    sseHub.publish(`author:${target.authorId}`, event);
  }

  if (target.admins) {
    sseHub.publish('admins', event);
  }
}
