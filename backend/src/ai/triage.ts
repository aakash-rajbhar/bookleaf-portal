import { z } from 'zod';
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TicketCategory,
  TicketPriority,
} from '../constants/ticket';
import { getProvider } from './index';
import { AIUnavailableError } from './errors';
import { TRIAGE_SYSTEM_PROMPT, buildTriagePrompt } from './prompts/triage';
import { fallbackClassifier } from './fallbackClassifier';
import { logAiCall } from '../db/aiUsageLog';

export const triageOutputSchema = z.object({
  category: z.enum(TICKET_CATEGORIES),
  priority: z.enum(TICKET_PRIORITIES),
  reason: z.string().trim().max(200),
});

export type TriageOutput = z.infer<typeof triageOutputSchema>;

export const triageJsonSchema = {
  type: 'object',
  properties: {
    category: {
      type: 'string',
      enum: [...TICKET_CATEGORIES],
    },
    priority: {
      type: 'string',
      enum: [...TICKET_PRIORITIES],
    },
    reason: {
      type: 'string',
      maxLength: 200,
    },
  },
  required: ['category', 'priority', 'reason'],
};

export interface TriageTicketInput {
  id?: string;
  subject: string;
  description: string;
  book?: {
    title: string;
    status: string;
    royaltyPending?: number;
    royaltyPaid?: number;
    lastPayoutDate?: string | null;
  } | null;
}

export interface TriageResult {
  category: TicketCategory;
  priority: TicketPriority;
  reason: string;
  source: 'ai' | 'fallback';
  aiStatus: 'done' | 'failed';
  tokens?: {
    promptTokens: number;
    completionTokens: number;
    thinkingTokens: number;
  };
  latencyMs?: number;
}

/**
 * Pure function guardrails applied after model or fallback classification.
 * KB Policy: Any ISBN & Metadata issue must be at least 'High' priority.
 */
export function applyTriageGuardrails(
  category: TicketCategory,
  priority: TicketPriority
): TicketPriority {
  if (category === 'ISBN & Metadata') {
    if (priority === 'Medium' || priority === 'Low') {
      return 'High';
    }
  }
  return priority;
}

/**
 * Triages a ticket using LLMProvider with code guardrails, falling back to
 * rule-based classification on AIUnavailableError.
 */
export async function triageTicket(
  ticket: TriageTicketInput
): Promise<TriageResult> {
  const provider = getProvider();
  const prompt = buildTriagePrompt(ticket);
  const startMs = Date.now();

  try {
    const res = await provider.generateJSON({
      system: TRIAGE_SYSTEM_PROMPT,
      prompt,
      schema: triageOutputSchema,
      jsonSchema: triageJsonSchema,
      maxOutputTokens: 400,
    });

    const guardedPriority = applyTriageGuardrails(
      res.data.category,
      res.data.priority
    );

    const result: TriageResult = {
      category: res.data.category,
      priority: guardedPriority,
      reason: res.data.reason.slice(0, 200),
      source: 'ai',
      aiStatus: 'done',
      tokens: {
        promptTokens: res.usage.promptTokens,
        completionTokens: res.usage.completionTokens,
        thinkingTokens: res.usage.thinkingTokens,
      },
      latencyMs: res.usage.latencyMs,
    };

    if (ticket.id) {
      await logAiCall({
        ticketId: ticket.id,
        task: 'triage',
        model: res.usage.model,
        promptTokens: res.usage.promptTokens,
        completionTokens: res.usage.completionTokens,
        thinkingTokens: res.usage.thinkingTokens,
        latencyMs: res.usage.latencyMs,
        success: true,
      });
    }

    return result;
  } catch (err: unknown) {
    const elapsed = Date.now() - startMs;
    const reason =
      err instanceof AIUnavailableError ? err.reason : 'upstream';

    if (ticket.id) {
      await logAiCall({
        ticketId: ticket.id,
        task: 'triage',
        model: provider.model,
        promptTokens: 0,
        completionTokens: 0,
        latencyMs: elapsed,
        success: false,
        error: reason,
      });
    }

    const fallback = fallbackClassifier(ticket.subject, ticket.description);
    const guardedFallbackPriority = applyTriageGuardrails(
      fallback.category,
      fallback.priority
    );

    return {
      category: fallback.category,
      priority: guardedFallbackPriority,
      reason: `AI unavailable: ${reason}; rule-based fallback used`,
      source: 'fallback',
      aiStatus: 'failed',
      latencyMs: elapsed,
    };
  }
}
