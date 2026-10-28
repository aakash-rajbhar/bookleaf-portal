import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  PRIORITY_RANK,
  TicketCategory,
  TicketPriority,
} from '../src/constants/ticket';
import { triageTicket } from '../src/ai/triage';
import { fallbackClassifier } from '../src/ai/fallbackClassifier';

interface TestCase {
  id: string;
  subject: string;
  description: string;
  bookStatus?: string;
  expectedCategory: TicketCategory;
  expectedPriority: TicketPriority;
}

interface CaseResult {
  id: string;
  subject: string;
  expectedCat: string;
  actualCat: string;
  catMatch: boolean;
  expectedPrio: string;
  actualPrio: string;
  prioExact: boolean;
  prioWithinOne: boolean;
  latencyMs?: number;
}

interface ModelMetrics {
  total: number;
  catCorrect: number;
  prioExact: number;
  prioWithinOne: number;
  totalLatencyMs: number;
}

function computeMetrics(results: CaseResult[]): ModelMetrics {
  let catCorrect = 0;
  let prioExact = 0;
  let prioWithinOne = 0;
  let totalLatencyMs = 0;

  for (const r of results) {
    if (r.catMatch) catCorrect++;
    if (r.prioExact) prioExact++;
    if (r.prioWithinOne) prioWithinOne++;
    totalLatencyMs += r.latencyMs ?? 0;
  }

  return {
    total: results.length,
    catCorrect,
    prioExact,
    prioWithinOne,
    totalLatencyMs,
  };
}

function formatPercent(count: number, total: number): string {
  if (total === 0) return '0.0%';
  return `${((count / total) * 100).toFixed(1)}%`;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const isMock = process.argv.includes('--mock');
  const fallbackOnly = process.argv.includes('--fallback-only');

  if (isMock) {
    process.env.AI_PROVIDER = 'mock';
  }

  const jsonPath = path.resolve(__dirname, '../src/ai/evals/triageCases.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`Eval dataset not found at: ${jsonPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, 'utf8');
  const cases: TestCase[] = JSON.parse(raw);

  console.log(`\n============================================================`);
  console.log(`BookLeaf AI Triage Evaluation (${cases.length} labeled test cases)`);
  console.log(`Mode: ${fallbackOnly ? 'Fallback Only' : isMock ? 'Mock Provider + Fallback' : 'Real Provider + Fallback'}`);
  console.log(`============================================================\n`);

  // 1. Evaluate Fallback Classifier
  console.log('--- 1. Evaluating Rule-Based Fallback Classifier ---');
  const fallbackResults: CaseResult[] = [];

  for (const c of cases) {
    const start = Date.now();
    const res = fallbackClassifier(c.subject, c.description);
    const latencyMs = Date.now() - start;

    const catMatch = res.category === c.expectedCategory;
    const prioExact = res.priority === c.expectedPriority;
    const diff = Math.abs(PRIORITY_RANK[res.priority] - PRIORITY_RANK[c.expectedPriority]);
    const prioWithinOne = diff <= 1;

    fallbackResults.push({
      id: c.id,
      subject: c.subject.slice(0, 32).padEnd(32),
      expectedCat: c.expectedCategory,
      actualCat: res.category,
      catMatch,
      expectedPrio: c.expectedPriority,
      actualPrio: res.priority,
      prioExact,
      prioWithinOne,
      latencyMs,
    });
  }

  console.log('\nFallback Classifier Case Breakdown:');
  console.log('ID                 | Category (Exp vs Act)                | Priority (Exp vs Act) | Match');
  console.log('-------------------|--------------------------------------|-----------------------|------');
  for (const r of fallbackResults) {
    const catStr = `${r.expectedCat.slice(0, 15)} vs ${r.actualCat.slice(0, 15)}`.padEnd(36);
    const prioStr = `${r.expectedPrio.slice(0, 8)} vs ${r.actualPrio.slice(0, 8)}`.padEnd(21);
    const m = r.catMatch && r.prioExact ? '✓ ALL' : r.catMatch ? '✓ CAT' : r.prioExact ? '✓ PRIO' : '✗';
    console.log(`${r.id.padEnd(18)} | ${catStr} | ${prioStr} | ${m}`);
  }

  // 2. Evaluate Primary Provider (unless --fallback-only)
  const providerResults: CaseResult[] = [];
  if (!fallbackOnly) {
    console.log('\n--- 2. Evaluating LLM Provider ---');
    for (let i = 0; i < cases.length; i++) {
      const c = cases[i];
      process.stdout.write(`[${i + 1}/${cases.length}] Evaluating "${c.id}"... `);

      const start = Date.now();
      const res = await triageTicket({
        subject: c.subject,
        description: c.description,
        book: c.bookStatus ? { title: 'Sample Title', status: c.bookStatus } : null,
      });
      const latencyMs = Date.now() - start;

      const catMatch = res.category === c.expectedCategory;
      const prioExact = res.priority === c.expectedPriority;
      const diff = Math.abs(PRIORITY_RANK[res.priority] - PRIORITY_RANK[c.expectedPriority]);
      const prioWithinOne = diff <= 1;

      console.log(`${res.category} / ${res.priority} (${latencyMs}ms) [${res.source}]`);

      providerResults.push({
        id: c.id,
        subject: c.subject.slice(0, 32).padEnd(32),
        expectedCat: c.expectedCategory,
        actualCat: res.category,
        catMatch,
        expectedPrio: c.expectedPriority,
        actualPrio: res.priority,
        prioExact,
        prioWithinOne,
        latencyMs,
      });

      // Space real provider calls at least 13 seconds apart to respect free tier RPM limits
      if (!isMock && i < cases.length - 1) {
        console.log(`Waiting 13s for rate limit pacing...`);
        await sleep(13000);
      }
    }
  }

  // 3. Summary Table
  const fbMetrics = computeMetrics(fallbackResults);
  const provMetrics = providerResults.length > 0 ? computeMetrics(providerResults) : null;

  console.log('\n============================================================');
  console.log('                 Triage Accuracy Summary                    ');
  console.log('============================================================');
  console.log('| Metric                    | Fallback Classifier | Primary Provider     |');
  console.log('|---------------------------|---------------------|----------------------|');
  console.log(
    `| Total Cases               | ${String(fbMetrics.total).padEnd(19)} | ${(provMetrics ? String(provMetrics.total) : 'N/A').padEnd(20)} |`
  );
  console.log(
    `| Category Accuracy         | ${formatPercent(fbMetrics.catCorrect, fbMetrics.total).padEnd(19)} | ${(provMetrics ? formatPercent(provMetrics.catCorrect, provMetrics.total) : 'N/A').padEnd(20)} |`
  );
  console.log(
    `| Priority Exact Match      | ${formatPercent(fbMetrics.prioExact, fbMetrics.total).padEnd(19)} | ${(provMetrics ? formatPercent(provMetrics.prioExact, provMetrics.total) : 'N/A').padEnd(20)} |`
  );
  console.log(
    `| Priority Within 1 Level   | ${formatPercent(fbMetrics.prioWithinOne, fbMetrics.total).padEnd(19)} | ${(provMetrics ? formatPercent(provMetrics.prioWithinOne, provMetrics.total) : 'N/A').padEnd(20)} |`
  );
  console.log(
    `| Avg Latency               | ${(fbMetrics.totalLatencyMs / fbMetrics.total).toFixed(1)}ms`.padEnd(31) +
      ` | ${(provMetrics ? (provMetrics.totalLatencyMs / provMetrics.total).toFixed(1) + 'ms' : 'N/A').padEnd(20)} |`
  );
  console.log('============================================================\n');
}

main().catch((err) => {
  console.error('Eval failed:', err);
  process.exit(1);
});
