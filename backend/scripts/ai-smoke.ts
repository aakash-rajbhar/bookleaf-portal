import 'dotenv/config';
import { z } from 'zod';
import { getProvider, AIUnavailableError } from '../src/ai';
import { logAiCall } from '../src/db/aiUsageLog';
import { pool } from '../src/db/pool';

/**
 * AI Smoke Test:
 * 1. generateText: "Reply with the word OK"
 * 2. generateJSON: with a tiny schema { answer: string }
 *
 * Prints text/data, usage and latency.
 * On AIUnavailableError prints `reason=<reason>` only, no stack trace.
 */
async function main() {
  const provider = getProvider();

  let stepStart = Date.now();

  try {
    // 1. generateText
    stepStart = Date.now();
    const textRes = await provider.generateText({
      system: 'Keep your response brief.',
      prompt: 'Reply with the word OK',
      maxOutputTokens: 50,
    });
    console.log('Text:', JSON.stringify(textRes.text));
    console.log('Usage:', JSON.stringify(textRes.usage));
    console.log(`Latency: ${textRes.usage.latencyMs}ms`);

    await logAiCall({
      ticketId: null,
      task: 'smoke',
      model: textRes.usage.model,
      promptTokens: textRes.usage.promptTokens,
      completionTokens: textRes.usage.completionTokens,
      thinkingTokens: textRes.usage.thinkingTokens,
      latencyMs: textRes.usage.latencyMs,
      success: true,
    });

    // 2. generateJSON
    const schema = z.object({ answer: z.string() });
    const jsonSchema = {
      type: 'object',
      properties: { answer: { type: 'string' } },
      required: ['answer'],
    };

    stepStart = Date.now();
    const jsonRes = await provider.generateJSON({
      system: 'Output JSON matching the schema.',
      prompt: 'Reply with the word OK in JSON { answer: "OK" }',
      schema,
      jsonSchema,
      maxOutputTokens: 300,
    });
    console.log('Data:', JSON.stringify(jsonRes.data));
    console.log('Usage:', JSON.stringify(jsonRes.usage));
    console.log(`Latency: ${jsonRes.usage.latencyMs}ms`);

    await logAiCall({
      ticketId: null,
      task: 'smoke',
      model: jsonRes.usage.model,
      promptTokens: jsonRes.usage.promptTokens,
      completionTokens: jsonRes.usage.completionTokens,
      thinkingTokens: jsonRes.usage.thinkingTokens,
      latencyMs: jsonRes.usage.latencyMs,
      success: true,
    });
  } catch (err: unknown) {
    const elapsed = Date.now() - stepStart;
    if (err instanceof AIUnavailableError) {
      console.log(`reason=${err.reason}`);
      await logAiCall({
        ticketId: null,
        task: 'smoke',
        model: provider.model,
        promptTokens: 0,
        completionTokens: 0,
        latencyMs: elapsed,
        success: false,
        error: err.reason,
      });
      process.exit(1);
    }
    console.error('Unexpected error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  } finally {
    await pool.end().catch(() => {});
  }
}

main().catch((err) => {
  if (err instanceof AIUnavailableError) {
    console.log(`reason=${err.reason}`);
  } else {
    console.error('Unexpected error:', err instanceof Error ? err.message : String(err));
  }
  process.exit(1);
});
