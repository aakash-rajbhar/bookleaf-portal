import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

/**
 * Utility: list Gemini models available to the configured key, or ping one.
 *   npx tsx scripts/ai-models.ts                 -> list models that support generateContent
 *   npx tsx scripts/ai-models.ts --test <model>  -> send one tiny request to that model
 * Never prints the API key.
 */
async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "API_KEY_ADDED") {
    console.error(
      "GEMINI_API_KEY is missing or still a placeholder in backend/.env",
    );
    process.exit(1);
  }
  const ai = new GoogleGenAI({ apiKey });

  const testIdx = process.argv.indexOf("--test");
  if (testIdx !== -1) {
    const model = process.argv[testIdx + 1] ?? process.env.GEMINI_MODEL;
    if (!model) {
      console.error("Usage: --test <model-name>");
      process.exit(1);
    }
    const started = Date.now();
    try {
      const res = await ai.models.generateContent({
        model,
        contents: "Reply with the single word OK.",
        config: { maxOutputTokens: 50 },
      });
      console.log(`Model "${model}" responded in ${Date.now() - started}ms`);
      console.log("Text:", JSON.stringify(res.text));
      console.log("Usage:", JSON.stringify(res.usageMetadata));
    } catch (err: any) {
      console.error(
        `Model "${model}" failed: status=${err?.status ?? "n/a"} message=${String(err?.message ?? err).slice(0, 300)}`,
      );
      process.exit(1);
    }
    return;
  }

  const rows: string[] = [];
  const pager = await ai.models.list();
  for await (const m of pager) {
    const actions: string[] = (m as any).supportedActions ?? [];
    if (actions.length && !actions.includes("generateContent")) continue; // skip embedding/image-only models
    const id = (m.name ?? "").replace(/^models\//, "");
    rows.push(
      `${id.padEnd(45)} in:${m.inputTokenLimit ?? "?"}  out:${m.outputTokenLimit ?? "?"}`,
    );
  }
  rows.sort();
  console.log(`${rows.length} models support generateContent:\n`);
  console.log(rows.join("\n"));
  console.log(
    "\nSet GEMINI_MODEL in .env to one of the names on the left, then run with --test <name>.",
  );
}

main().catch((e) => {
  console.error("Failed:", String(e?.message ?? e).slice(0, 300));
  process.exit(1);
});
