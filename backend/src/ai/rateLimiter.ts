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
  private cooldownUntil: number = 0;
  private cooldownReason: 'rate_limited' | 'quota' | null = null;

  private getUtcDay(): string {
    return new Date().toISOString().slice(0, 10);
  }

  /**
   * Set a temporary cooldown after upstream 429/quota error.
   */
  setCooldown(reason: 'rate_limited' | 'quota', durationMs: number): void {
    const until = Date.now() + durationMs;
    if (until > this.cooldownUntil) {
      this.cooldownUntil = until;
      this.cooldownReason = reason;
    }
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
   * - In cooldown -> throws immediately without sending request
   * - Daily cap reached -> throws AIUnavailableError('quota')
   * - Free per-minute slot -> proceeds immediately
   * - Slot frees within 10s -> waits for it
   * - Slot frees after >10s -> throws AIUnavailableError('rate_limited')
   */
  async acquire(): Promise<void> {
    const now = Date.now();
    if (this.cooldownReason && now < this.cooldownUntil) {
      throw new AIUnavailableError(
        this.cooldownReason,
        `AI provider in cooldown until ${new Date(this.cooldownUntil).toISOString()}`
      );
    } else {
      this.cooldownReason = null;
      this.cooldownUntil = 0;
    }

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
    this.cooldownUntil = 0;
    this.cooldownReason = null;
  }
}

export const rateLimiter = new RateLimiter();
