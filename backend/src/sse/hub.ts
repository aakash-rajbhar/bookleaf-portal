import type { Response } from 'express';

export interface HubEvent {
  type: string;
  ticketId: string;
}

export class SseHub {
  private channels = new Map<string, Set<Response>>();

  /**
   * Subscribes a client response stream to a channel key ('admins' or 'author:<authorId>').
   */
  subscribe(key: string, res: Response): void {
    if (!this.channels.has(key)) {
      this.channels.set(key, new Set());
    }

    const set = this.channels.get(key)!;
    set.add(res);

    console.log(
      `[SSE Hub] Subscribed client to "${key}". Active connections in channel: ${set.size}`
    );
  }

  /**
   * Unsubscribes a client response stream on disconnect.
   */
  unsubscribe(key: string, res: Response): void {
    const set = this.channels.get(key);
    if (!set) return;

    set.delete(res);
    console.log(
      `[SSE Hub] Unsubscribed client from "${key}". Remaining connections in channel: ${set.size}`
    );

    if (set.size === 0) {
      this.channels.delete(key);
    }
  }

  /**
   * Broadcasts a minimal {type, ticketId} frame to all active connections in the channel.
   * Format: `event: <type>\ndata: <json>\n\n`
   */
  publish(key: string, event: HubEvent): void {
    const set = this.channels.get(key);
    if (!set || set.size === 0) {
      console.log(`[SSE Hub] Publish to "${key}": no active subscribers.`);
      return;
    }

    const payload = JSON.stringify(event);
    const message = `event: ${event.type}\ndata: ${payload}\n\n`;

    console.log(
      `[SSE Hub] Broadcasting event "${event.type}" to ${set.size} client(s) on "${key}"`
    );

    for (const res of set) {
      try {
        res.write(message);
      } catch (err) {
        console.error(`[SSE Hub] Error writing to stream on "${key}":`, err);
      }
    }
  }

  /**
   * Total active connections across all channels.
   */
  getTotalSubscribers(): number {
    let total = 0;
    for (const set of this.channels.values()) {
      total += set.size;
    }
    return total;
  }
}

export const sseHub = new SseHub();
