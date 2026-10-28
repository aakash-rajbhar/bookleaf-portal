import { env } from '../config/env';
import { AIUnavailableError } from './errors';

/**
 * Sliding-window rate limiter shared across all AI calls.
 * Enforces:
 *   1. AI_RPM_LIMIT calls per rolling 60 seconds.
 *   2. AI_DAILY_LIMIT calls per UTC day.
 *
 * Failing fast triggers fallback logic instead of stacking up requests.
 */
export class RateLimiter {
  private minuteTimestamps: number[] = [];
  private currentUtcDay: string = this.getUtcDay();
  private todayCount: number = 0;

  private getUtcDay(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private syncDaily(): void {
    const today = this.getUtcDay();
    if (this.currentUtcDay !== today) {
      this.currentUtcDay = today;
      this.todayCount = 0;
    }
  }

  private pruneMinute(now: number): void {
    const windowStart = now - 60_000;
    while (this.minuteTimestamps.length > 0 && this.minuteTimestamps[0] <= windowStart) {
      this.minuteTimestamps.shift();
    }
  }

  /**
   * Acquire a rate limit slot.
   * - Daily cap reached -> throws AIUnavailableError('quota')
   * - Free per-minute slot -> proceeds immediately
   * - Slot frees within 10s -> waits for it
   * - Slot frees after >10s -> throws AIUnavailableError('rate_limited')
   */
  async acquire(): Promise<void> {
    const now = Date.now();
    this.syncDaily();

    if (this.todayCount >= env.AI_DAILY_LIMIT) {
      throw new AIUnavailableError('quota', 'Daily AI quota limit reached');
    }

    this.pruneMinute(now);

    if (this.minuteTimestamps.length < env.AI_RPM_LIMIT) {
      this.minuteTimestamps.push(now);
      this.todayCount++;
      return;
    }

    // Window is full; inspect when the oldest slot frees
    const oldest = this.minuteTimestamps[0];
    const waitMs = oldest + 60_000 - now;

    if (waitMs > 10_000) {
      throw new AIUnavailableError('rate_limited', 'Per-minute AI rate limit exceeded');
    }

    // Wait until slot frees (+ a slight 15ms buffer to ensure timestamp clears)
    const sleepTime = Math.max(0, waitMs + 15);
    await new Promise((resolve) => setTimeout(resolve, sleepTime));

    // Re-validate after sleep
    const wakeNow = Date.now();
    this.syncDaily();
    if (this.todayCount >= env.AI_DAILY_LIMIT) {
      throw new AIUnavailableError('quota', 'Daily AI quota limit reached');
    }

    this.pruneMinute(wakeNow);
    if (this.minuteTimestamps.length < env.AI_RPM_LIMIT) {
      this.minuteTimestamps.push(wakeNow);
      this.todayCount++;
      return;
    }

    throw new AIUnavailableError('rate_limited', 'Per-minute AI rate limit exceeded');
  }

  /**
   * Export usage stats for monitoring.
   */
  getStats(): { usedThisMinute: number; usedToday: number } {
    const now = Date.now();
    this.syncDaily();
    this.pruneMinute(now);
    return {
      usedThisMinute: this.minuteTimestamps.length,
      usedToday: this.todayCount,
    };
  }

  /**
   * Reset limiter state (primarily for tests).
   */
  reset(): void {
    this.minuteTimestamps = [];
    this.currentUtcDay = this.getUtcDay();
    this.todayCount = 0;
  }
}

export const rateLimiter = new RateLimiter();
