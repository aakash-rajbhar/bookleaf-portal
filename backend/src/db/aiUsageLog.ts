import { pool } from './pool';

export interface LogAiCallParams {
  ticketId: string | null;
  task: 'triage' | 'draft' | 'smoke';
  model: string;
  promptTokens: number;
  completionTokens: number;
  thinkingTokens?: number;
  latencyMs: number;
  success: boolean;
  error?: string | null;
}

/**
 * Inserts an AI operation audit/telemetry record into ai_usage_log.
 * Telemetry logging failure is safely caught and ignored so it never throws into the caller.
 */
export async function logAiCall(params: LogAiCallParams): Promise<void> {
  try {
    // TODO: Add thinking_tokens column to ai_usage_log in a future migration if separate reporting is required.
    // Currently, thinking tokens are folded into completion_tokens to preserve total token telemetry.
    const effectiveCompletionTokens =
      params.completionTokens + (params.thinkingTokens ?? 0);

    const sql = `
      INSERT INTO ai_usage_log (
        ticket_id,
        task,
        model,
        prompt_tokens,
        completion_tokens,
        latency_ms,
        success,
        error
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    await pool.query(sql, [
      params.ticketId ?? null,
      params.task,
      params.model,
      params.promptTokens,
      effectiveCompletionTokens,
      params.latencyMs,
      params.success,
      params.error ?? null,
    ]);
  } catch (err) {
    // Telemetry errors must never disrupt business operations
    console.error('Failed to record ai_usage_log:', err instanceof Error ? err.message : String(err));
  }
}
