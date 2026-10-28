/**
 * Stub for the AI triage queue.
 * The full asynchronous queue implementation with Gemini triage and fallback will be implemented in T10.
 */
export class TriageQueue {
  async enqueue(ticketId: string): Promise<void> {
    console.log(`[TriageQueue Stub] Enqueued ticket ${ticketId} for async triage.`);
  }
}

export const triageQueue = new TriageQueue();
