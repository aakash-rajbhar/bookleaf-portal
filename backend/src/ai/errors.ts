export type AIUnavailableReason =
  | 'not_configured'
  | 'timeout'
  | 'rate_limited'
  | 'quota'
  | 'upstream'
  | 'invalid_output';

/**
 * Universal error class for all AI failures.
 * Callers only ever catch AIUnavailableError; SDK-specific errors are mapped to this.
 * Error messages must never leak API keys or sensitive details.
 */
export class AIUnavailableError extends Error {
  readonly reason: AIUnavailableReason;

  constructor(reason: AIUnavailableReason, message?: string) {
    super(message ?? `AI operation unavailable: ${reason}`);
    this.name = 'AIUnavailableError';
    this.reason = reason;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
