# Cohort Atlas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished local Cohort Atlas prototype that turns offline monthly CSV records into a refreshed accelerator cohort graph and executive insight review.

**Architecture:** Use a local-first Vite React app with deterministic domain adapters for CSV parsing and fit evaluation. Keep the UI split into focused components so the post-ingestion executive review can become the visual destination without turning the dashboard into one large file.

**Tech Stack:** Vite, React, TypeScript, Tailwind CSS via `@tailwindcss/vite`, React Flow via `@xyflow/react`, PapaParse, Vitest, Testing Library.

---

## References

- Vite guide: `https://vite.dev/guide/`
- Tailwind CSS Vite install guide: `https://tailwindcss.com/docs/installation/using-vite`
- React Flow install guide: `https://reactflow.dev/learn`
- Approved spec: `docs/superpowers/specs/2026-05-16-cohort-atlas-design.md`

## File Structure

Create this structure:

```text
/Users/jamesyeang/Downloads/BWAI
├── index.html
├── package.json
├── public/
│   └── monthly-sync-sample.csv
├── scripts/
│   └── check-no-gradients.mjs
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles.css
│   ├── components/
│   │   ├── AppShell.tsx
│   │   ├── CohortGraph.tsx
│   │   ├── CohortMetrics.tsx
│   │   ├── DashboardHeader.tsx
│   │   ├── IngestionPanel.tsx
│   │   ├── InsightDrawer.tsx
│   │   ├── ProcessingTimeline.tsx
│   │   ├── RelationshipCard.tsx
│   │   └── StatusLegend.tsx
│   ├── domain/
│   │   ├── csv.ts
│   │   ├── evaluator.ts
│   │   ├── graphViewModel.ts
│   │   ├── sampleCohort.ts
│   │   └── types.ts
│   ├── state/
│   │   └── useCohortDemo.ts
│   └── test/
│       └── setup.ts
├── src/domain/__tests__/
│   ├── csv.test.ts
│   ├── evaluator.test.ts
│   └── graphViewModel.test.ts
└── src/state/__tests__/
    └── useCohortDemo.test.tsx
```

Responsibilities:

- `domain/types.ts`: shared type contracts only.
- `domain/sampleCohort.ts`: fictional accelerator mentors, startups, baseline relationships, and deterministic post-ingestion evaluation results.
- `domain/csv.ts`: CSV parsing and validation.
- `domain/evaluator.ts`: local deterministic Gemini-style adapter boundary.
- `domain/graphViewModel.ts`: converts relationship state into React Flow nodes and edges.
- `state/useCohortDemo.ts`: app state, local persistence, processing sequence, reset.
- `components/*`: presentational UI pieces only.
- `scripts/check-no-gradients.mjs`: fail the build if CSS gradients or gradient text sneak in.

## Task 1: Scaffold Vite React App And Tooling

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Scaffold the app**

Run:

```bash
npm create vite@latest . -- --template react-ts
```

Expected: Vite creates a React TypeScript project in `/Users/jamesyeang/Downloads/BWAI`.

- [ ] **Step 2: Install runtime dependencies**

Run:

```bash
npm install @tailwindcss/vite tailwindcss @xyflow/react papaparse lucide-react clsx
```

Expected: dependencies are added to `package.json`.

- [ ] **Step 3: Install test dependencies**

Run:

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/papaparse
```

Expected: dev dependencies are added to `package.json`.

- [ ] **Step 4: Configure Vite, Tailwind, and Vitest**

Modify `vite.config.ts` to:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
```

- [ ] **Step 5: Add test setup**

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 6: Replace default scripts**

Modify `package.json` scripts to include:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "check:no-gradients": "node scripts/check-no-gradients.mjs"
  }
}
```

- [ ] **Step 7: Create no-gradient base CSS**

Replace `src/styles.css` with:

```css
@import "tailwindcss";
@import "@xyflow/react/dist/style.css";

:root {
  color: #17211c;
  background: #ede4d1;
  font-family: Charter, "Iowan Old Style", "Hoefler Text", Georgia, serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 1024px;
  min-height: 100vh;
  background: #ede4d1;
}

button,
input,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

.ui-sans {
  font-family: "Avenir Next", "Gill Sans", "Trebuchet MS", sans-serif;
}

.react-flow__attribution {
  display: none;
}
```

- [ ] **Step 8: Create temporary app smoke screen**

Replace `src/App.tsx` with:

```tsx
export default function App() {
  return (
    <main className="min-h-screen bg-[#ede4d1] p-8 text-[#17211c]">
      <h1 className="text-5xl font-bold">Cohort Atlas</h1>
      <p className="ui-sans mt-3 text-sm uppercase tracking-[0.08em] text-[#405047]">
        Local prototype scaffold ready
      </p>
    </main>
  );
}
```

- [ ] **Step 9: Verify scaffold**

Run:

```bash
npm run build
```

Expected: `tsc -b && vite build` completes successfully.

- [ ] **Step 10: Commit**

Run:

```bash
git add package.json package-lock.json index.html vite.config.ts tsconfig.json tsconfig.node.json src/main.tsx src/App.tsx src/styles.css src/test/setup.ts
git commit -m "chore: scaffold Cohort Atlas app"
```

## Task 2: Add Domain Types, Sample Data, CSV Parser, And Evaluator

**Files:**
- Create: `public/monthly-sync-sample.csv`
- Create: `src/domain/types.ts`
- Create: `src/domain/sampleCohort.ts`
- Create: `src/domain/csv.ts`
- Create: `src/domain/evaluator.ts`
- Create: `src/domain/__tests__/csv.test.ts`
- Create: `src/domain/__tests__/evaluator.test.ts`

- [ ] **Step 1: Add shared domain types**

Create `src/domain/types.ts`:

```ts
export type HealthStatus = 'healthy' | 'watch' | 'at-risk';

export type Mentor = {
  id: string;
  name: string;
  role: string;
  domain: string;
};

export type Startup = {
  id: string;
  name: string;
  category: string;
  stage: string;
  founder: string;
};

export type Relationship = {
  id: string;
  mentorId: string;
  startupId: string;
  baselineHealth: number;
  currentHealth: number;
  status: HealthStatus;
  hoursSynced: number;
  lastSignal: string;
  rationale: string;
  recommendedAction: string;
};

export type CohortSyncRow = {
  mentor_id: string;
  startup_id: string;
  hours_synced: number;
  milestones_completed: string;
  blockers_identified: string;
  founder_confidence_score: number;
  mentor_confidence_score: number;
};

export type RelationshipEvaluation = {
  relationshipId: string;
  engagement_health: number;
  previous_health: number;
  health_delta: number;
  confidence: number;
  reasoning: string;
  signals: {
    positive: string[];
    negative: string[];
  };
  recommended_action: string;
};

export type CohortEvaluation = {
  processedRows: number;
  cohortHealth: number;
  confidence: number;
  executiveSummary: string;
  relationshipEvaluations: RelationshipEvaluation[];
};
```

- [ ] **Step 2: Add sample CSV**

Create `public/monthly-sync-sample.csv`:

```csv
mentor_id,startup_id,hours_synced,milestones_completed,blockers_identified,founder_confidence_score,mentor_confidence_score
M-104,S-LOOP,7,Drafted GTM strategy and completed pricing test,Enterprise buyer intro still blocked by unclear champion,8,8
M-207,S-ORBIT,6,Refined investor narrative and resolved pilot objections,Needs stronger proof around deployment timeline,8,9
M-116,S-NORTH,4,Reviewed onboarding map,Next milestone owner unclear and founder follow-through uneven,5,6
M-319,S-KIN,8,Closed first design partner and reviewed renewal plan,No material blocker identified this month,9,9
M-058,S-PULSE,5,Completed technical risk review,Integration blocker escalated to product mentor,6,7
M-104,S-VAULT,6,Clarified ICP and revised sales sequence,Pipeline quality still mixed,7,8
M-221,S-HELIOS,3,Reviewed hiring plan,Low sync hours and founder confidence dipped after missed sprint,4,5
M-207,S-FERN,7,Completed retention analysis and success metrics,Needs clearer customer expansion owner,8,8
M-410,S-LOOP,5,Reviewed enterprise proposal draft,Procurement objection still unresolved,7,7
M-319,S-NOVA,8,Finalized launch checklist and demo narrative,No blocker identified beyond scheduling,9,8
M-058,S-HELIOS,6,Rebuilt sprint plan with measurable owner,Technical blocker reduced but not closed,7,7
M-221,S-PULSE,5,Reviewed clinical validation memo,Founder still uncertain on regulatory sequencing,6,6
```

- [ ] **Step 3: Add sample cohort metadata**

Create `src/domain/sampleCohort.ts` with mentors, startups, baseline relationships, and a helper:

```ts
import type { Mentor, Relationship, Startup } from './types';

export const mentors: Mentor[] = [
  { id: 'M-104', name: 'Maya Chen', role: 'Growth Partner', domain: 'GTM' },
  { id: 'M-207', name: 'Elena Park', role: 'Fundraising Lead', domain: 'Capital' },
  { id: 'M-116', name: 'Jon Bell', role: 'Product Operator', domain: 'Product' },
  { id: 'M-319', name: 'Ravi Shah', role: 'Enterprise Advisor', domain: 'Sales' },
  { id: 'M-058', name: 'Priya Raman', role: 'Technical Partner', domain: 'Architecture' },
  { id: 'M-221', name: 'Nadia Brooks', role: 'People Advisor', domain: 'Operations' },
  { id: 'M-410', name: 'Theo Grant', role: 'Procurement Coach', domain: 'Enterprise' },
];

export const startups: Startup[] = [
  { id: 'S-LOOP', name: 'LoopPay', category: 'Fintech workflow', stage: 'Seed', founder: 'Amir Cole' },
  { id: 'S-ORBIT', name: 'OrbitAI', category: 'AI operations', stage: 'Pre-seed', founder: 'Jules Tan' },
  { id: 'S-NORTH', name: 'Northstar', category: 'Talent infrastructure', stage: 'Seed', founder: 'Mina Reyes' },
  { id: 'S-KIN', name: 'KinLedger', category: 'Climate finance', stage: 'Seed', founder: 'Owen Hart' },
  { id: 'S-PULSE', name: 'PulseGrid', category: 'Health data', stage: 'Pre-seed', founder: 'Leah Noor' },
  { id: 'S-VAULT', name: 'Vaultline', category: 'Security automation', stage: 'Seed', founder: 'Theo Lim' },
  { id: 'S-HELIOS', name: 'HeliosHR', category: 'People analytics', stage: 'Pre-seed', founder: 'Sara Quinn' },
  { id: 'S-FERN', name: 'FernDesk', category: 'Customer success', stage: 'Seed', founder: 'Caleb Ng' },
  { id: 'S-NOVA', name: 'NovaRoute', category: 'Logistics planning', stage: 'Seed', founder: 'Iris Wong' },
];

export const baselineRelationships: Relationship[] = [
  {
    id: 'M-104:S-LOOP',
    mentorId: 'M-104',
    startupId: 'S-LOOP',
    baselineHealth: 31,
    currentHealth: 31,
    status: 'at-risk',
    hoursSynced: 1,
    lastSignal: 'Pricing and enterprise access unresolved',
    rationale: 'Relationship is stale and confidence is split.',
    recommendedAction: 'Schedule a focused GTM intervention.',
  },
  {
    id: 'M-207:S-ORBIT',
    mentorId: 'M-207',
    startupId: 'S-ORBIT',
    baselineHealth: 56,
    currentHealth: 56,
    status: 'watch',
    hoursSynced: 3,
    lastSignal: 'Narrative needs clearer deployment proof',
    rationale: 'Progress exists, but investor proof remains thin.',
    recommendedAction: 'Review pilot timeline evidence.',
  },
  {
    id: 'M-116:S-NORTH',
    mentorId: 'M-116',
    startupId: 'S-NORTH',
    baselineHealth: 38,
    currentHealth: 38,
    status: 'at-risk',
    hoursSynced: 2,
    lastSignal: 'No clear milestone owner',
    rationale: 'Low sync volume and unclear ownership create risk.',
    recommendedAction: 'Assign a milestone owner before the next check-in.',
  },
  {
    id: 'M-319:S-KIN',
    mentorId: 'M-319',
    startupId: 'S-KIN',
    baselineHealth: 69,
    currentHealth: 69,
    status: 'healthy',
    hoursSynced: 5,
    lastSignal: 'Design partner progress',
    rationale: 'Consistent progress and high confidence.',
    recommendedAction: 'Prepare the renewal plan review.',
  },
  {
    id: 'M-058:S-PULSE',
    mentorId: 'M-058',
    startupId: 'S-PULSE',
    baselineHealth: 44,
    currentHealth: 44,
    status: 'watch',
    hoursSynced: 2,
    lastSignal: 'Technical risk unresolved',
    rationale: 'The technical blocker needs escalation.',
    recommendedAction: 'Pair with a technical specialist.',
  },
  {
    id: 'M-221:S-HELIOS',
    mentorId: 'M-221',
    startupId: 'S-HELIOS',
    baselineHealth: 34,
    currentHealth: 34,
    status: 'at-risk',
    hoursSynced: 1,
    lastSignal: 'Founder confidence dipped',
    rationale: 'Low sync hours and missed sprint signal risk.',
    recommendedAction: 'Reset operating cadence this week.',
  },
];

export function statusFromHealth(score: number) {
  if (score >= 72) return 'healthy';
  if (score >= 50) return 'watch';
  return 'at-risk';
}
```

- [ ] **Step 4: Write CSV parser tests first**

Create `src/domain/__tests__/csv.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseCohortCsv } from '../csv';

const validCsv = `mentor_id,startup_id,hours_synced,milestones_completed,blockers_identified,founder_confidence_score,mentor_confidence_score
M-104,S-LOOP,7,Drafted GTM strategy,Enterprise intro blocked,8,8`;

describe('parseCohortCsv', () => {
  it('parses valid cohort sync rows', () => {
    const result = parseCohortCsv(validCsv);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toMatchObject({
        mentor_id: 'M-104',
        startup_id: 'S-LOOP',
        hours_synced: 7,
        founder_confidence_score: 8,
        mentor_confidence_score: 8,
      });
    }
  });

  it('rejects CSV missing required headers', () => {
    const result = parseCohortCsv('mentor_id,startup_id,hours_synced\\nM-104,S-LOOP,7');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('Missing required columns');
      expect(result.message).toContain('milestones_completed');
    }
  });

  it('rejects confidence scores outside the 1-10 range', () => {
    const result = parseCohortCsv(`mentor_id,startup_id,hours_synced,milestones_completed,blockers_identified,founder_confidence_score,mentor_confidence_score
M-104,S-LOOP,7,Drafted GTM strategy,Enterprise intro blocked,11,8`);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('founder_confidence_score');
    }
  });
});
```

- [ ] **Step 5: Run parser tests and verify failure**

Run:

```bash
npm run test:run -- src/domain/__tests__/csv.test.ts
```

Expected: FAIL because `src/domain/csv.ts` does not exist.

- [ ] **Step 6: Implement CSV parser**

Create `src/domain/csv.ts`:

```ts
import Papa from 'papaparse';
import type { CohortSyncRow } from './types';

const REQUIRED_COLUMNS = [
  'mentor_id',
  'startup_id',
  'hours_synced',
  'milestones_completed',
  'blockers_identified',
  'founder_confidence_score',
  'mentor_confidence_score',
] as const;

type ParseSuccess = { ok: true; rows: CohortSyncRow[] };
type ParseFailure = { ok: false; message: string };
export type ParseResult = ParseSuccess | ParseFailure;

function toNumber(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return Number.NaN;
  return Number(value.trim());
}

function validateScore(value: number, column: string, rowNumber: number): ParseFailure | null {
  if (!Number.isFinite(value) || value < 1 || value > 10) {
    return { ok: false, message: `${column} must be a number from 1-10 on row ${rowNumber}.` };
  }
  return null;
}

export function parseCohortCsv(csvText: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(csvText.trim(), {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    return { ok: false, message: `CSV parse failed: ${parsed.errors[0].message}` };
  }

  const fields = parsed.meta.fields ?? [];
  const missing = REQUIRED_COLUMNS.filter((column) => !fields.includes(column));
  if (missing.length > 0) {
    return { ok: false, message: `Missing required columns: ${missing.join(', ')}` };
  }

  if (parsed.data.length === 0) {
    return { ok: false, message: 'The CSV has no cohort sync rows.' };
  }

  const rows: CohortSyncRow[] = [];
  for (const [index, raw] of parsed.data.entries()) {
    const rowNumber = index + 2;
    const hours = toNumber(raw.hours_synced);
    const founderScore = toNumber(raw.founder_confidence_score);
    const mentorScore = toNumber(raw.mentor_confidence_score);

    if (!Number.isFinite(hours) || hours < 0) {
      return { ok: false, message: `hours_synced must be a non-negative number on row ${rowNumber}.` };
    }

    const founderError = validateScore(founderScore, 'founder_confidence_score', rowNumber);
    if (founderError) return founderError;

    const mentorError = validateScore(mentorScore, 'mentor_confidence_score', rowNumber);
    if (mentorError) return mentorError;

    rows.push({
      mentor_id: raw.mentor_id.trim(),
      startup_id: raw.startup_id.trim(),
      hours_synced: hours,
      milestones_completed: raw.milestones_completed.trim(),
      blockers_identified: raw.blockers_identified.trim(),
      founder_confidence_score: founderScore,
      mentor_confidence_score: mentorScore,
    });
  }

  return { ok: true, rows };
}
```

- [ ] **Step 7: Write evaluator tests first**

Create `src/domain/__tests__/evaluator.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { evaluateCohortSync } from '../evaluator';
import type { CohortSyncRow } from '../types';

const rows: CohortSyncRow[] = [
  {
    mentor_id: 'M-104',
    startup_id: 'S-LOOP',
    hours_synced: 7,
    milestones_completed: 'Drafted GTM strategy and completed pricing test',
    blockers_identified: 'Enterprise buyer intro still blocked by unclear champion',
    founder_confidence_score: 8,
    mentor_confidence_score: 8,
  },
  {
    mentor_id: 'M-116',
    startup_id: 'S-NORTH',
    hours_synced: 4,
    milestones_completed: 'Reviewed onboarding map',
    blockers_identified: 'Next milestone owner unclear and founder follow-through uneven',
    founder_confidence_score: 5,
    mentor_confidence_score: 6,
  },
];

describe('evaluateCohortSync', () => {
  it('returns deterministic cohort-level evaluation', () => {
    const result = evaluateCohortSync(rows);
    expect(result.processedRows).toBe(2);
    expect(result.cohortHealth).toBeGreaterThan(60);
    expect(result.executiveSummary).toContain('mentor records');
  });

  it('improves LoopPay while keeping Northstar on watch', () => {
    const result = evaluateCohortSync(rows);
    const loopPay = result.relationshipEvaluations.find((item) => item.relationshipId === 'M-104:S-LOOP');
    const northstar = result.relationshipEvaluations.find((item) => item.relationshipId === 'M-116:S-NORTH');

    expect(loopPay?.engagement_health).toBe(82);
    expect(loopPay?.health_delta).toBe(51);
    expect(northstar?.engagement_health).toBe(59);
    expect(northstar?.recommended_action).toContain('ownership');
  });
});
```

- [ ] **Step 8: Run evaluator tests and verify failure**

Run:

```bash
npm run test:run -- src/domain/__tests__/evaluator.test.ts
```

Expected: FAIL because `src/domain/evaluator.ts` does not exist.

- [ ] **Step 9: Implement deterministic evaluator**

Create `src/domain/evaluator.ts`:

```ts
import { baselineRelationships } from './sampleCohort';
import type { CohortEvaluation, CohortSyncRow, RelationshipEvaluation } from './types';

const DETERMINISTIC_RESULTS: Record<string, Omit<RelationshipEvaluation, 'relationshipId' | 'previous_health' | 'health_delta'>> = {
  'M-104:S-LOOP': {
    engagement_health: 82,
    confidence: 92,
    reasoning: 'GTM strategy, pricing test completion, and aligned confidence scores show a recovered mentor fit despite one remaining enterprise access blocker.',
    signals: {
      positive: ['Drafted GTM strategy', 'Completed pricing test', 'Founder and mentor confidence aligned at 8/10'],
      negative: ['Enterprise buyer intro still needs a champion'],
    },
    recommended_action: 'Use the next mentor session to secure a named enterprise champion.',
  },
  'M-207:S-ORBIT': {
    engagement_health: 78,
    confidence: 88,
    reasoning: 'Investor narrative and pilot objections improved enough to move the relationship into a healthy operating range.',
    signals: {
      positive: ['Investor narrative refined', 'Pilot objections resolved', 'Mentor confidence at 9/10'],
      negative: ['Deployment proof still needs sharper evidence'],
    },
    recommended_action: 'Attach deployment timeline proof to the next investor narrative review.',
  },
  'M-116:S-NORTH': {
    engagement_health: 59,
    confidence: 81,
    reasoning: 'Sync volume improved, but ownership ambiguity and uneven founder follow-through keep the relationship on watch.',
    signals: {
      positive: ['Onboarding map reviewed', 'Confidence improved modestly'],
      negative: ['Next milestone owner unclear', 'Founder follow-through uneven'],
    },
    recommended_action: 'Assign one milestone owner and review progress within seven days.',
  },
  'M-319:S-KIN': {
    engagement_health: 88,
    confidence: 94,
    reasoning: 'High sync hours, design partner progress, and no material blocker indicate a strong mentor-startup fit.',
    signals: {
      positive: ['Design partner closed', 'Renewal plan reviewed', 'Both confidence scores at 9/10'],
      negative: [],
    },
    recommended_action: 'Prepare a renewal plan pressure test for the next board update.',
  },
  'M-058:S-PULSE': {
    engagement_health: 67,
    confidence: 84,
    reasoning: 'Technical risk was escalated and confidence improved, but the integration blocker is not fully closed.',
    signals: {
      positive: ['Technical risk review completed', 'Blocker escalated to product mentor'],
      negative: ['Integration blocker remains open'],
    },
    recommended_action: 'Keep the relationship on watch until the integration owner confirms closure.',
  },
  'M-221:S-HELIOS': {
    engagement_health: 54,
    confidence: 79,
    reasoning: 'The sprint plan reset improved the signal, but prior low sync hours and founder confidence keep this relationship fragile.',
    signals: {
      positive: ['Sprint plan rebuilt', 'Measurable owner assigned'],
      negative: ['Founder confidence remains below cohort median'],
    },
    recommended_action: 'Review operating cadence after the next sprint checkpoint.',
  },
};

function baselineFor(id: string) {
  return baselineRelationships.find((relationship) => relationship.id === id)?.baselineHealth ?? 50;
}

export function evaluateCohortSync(rows: CohortSyncRow[]): CohortEvaluation {
  const relationshipEvaluations = rows
    .map((row) => {
      const relationshipId = `${row.mentor_id}:${row.startup_id}`;
      const deterministic = DETERMINISTIC_RESULTS[relationshipId];
      if (!deterministic) return null;

      const previous = baselineFor(relationshipId);
      return {
        relationshipId,
        previous_health: previous,
        health_delta: deterministic.engagement_health - previous,
        ...deterministic,
      };
    })
    .filter((item): item is RelationshipEvaluation => Boolean(item));

  const cohortHealth = Math.round(
    relationshipEvaluations.reduce((sum, item) => sum + item.engagement_health, 0) /
      Math.max(relationshipEvaluations.length, 1),
  );

  const confidence = Math.round(
    relationshipEvaluations.reduce((sum, item) => sum + item.confidence, 0) /
      Math.max(relationshipEvaluations.length, 1),
  );

  return {
    processedRows: rows.length,
    cohortHealth,
    confidence,
    executiveSummary:
      'Monthly mentor records show materially stronger cohort signal: recovered GTM relationships, clearer milestone evidence, and two remaining watchlist interventions.',
    relationshipEvaluations,
  };
}
```

- [ ] **Step 10: Verify domain tests pass**

Run:

```bash
npm run test:run -- src/domain/__tests__/csv.test.ts src/domain/__tests__/evaluator.test.ts
```

Expected: PASS.

- [ ] **Step 11: Commit**

Run:

```bash
git add public/monthly-sync-sample.csv src/domain src/domain/__tests__
git commit -m "feat: add cohort CSV evaluation domain"
```

## Task 3: Add Demo State, Persistence, And Processing Sequence

**Files:**
- Create: `src/state/useCohortDemo.ts`
- Create: `src/state/__tests__/useCohortDemo.test.tsx`

- [ ] **Step 1: Write state hook tests first**

Create `src/state/__tests__/useCohortDemo.test.tsx`:

```tsx
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCohortDemo } from '../useCohortDemo';

describe('useCohortDemo', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  it('starts in baseline state', () => {
    const { result } = renderHook(() => useCohortDemo());
    expect(result.current.phase).toBe('baseline');
    expect(result.current.relationships.some((relationship) => relationship.status === 'at-risk')).toBe(true);
  });

  it('processes sample data and opens the insight drawer', async () => {
    const { result } = renderHook(() => useCohortDemo());

    act(() => {
      result.current.processRows([
        {
          mentor_id: 'M-104',
          startup_id: 'S-LOOP',
          hours_synced: 7,
          milestones_completed: 'Drafted GTM strategy and completed pricing test',
          blockers_identified: 'Enterprise buyer intro still blocked by unclear champion',
          founder_confidence_score: 8,
          mentor_confidence_score: 8,
        },
      ]);
    });

    act(() => {
      vi.runAllTimers();
    });

    await waitFor(() => {
      expect(result.current.phase).toBe('processed');
      expect(result.current.drawerOpen).toBe(true);
    });
  });

  it('resets persisted processed state to baseline', () => {
    const { result } = renderHook(() => useCohortDemo());

    act(() => {
      result.current.resetDemo();
    });

    expect(result.current.phase).toBe('baseline');
    expect(result.current.drawerOpen).toBe(false);
  });
});
```

- [ ] **Step 2: Run hook tests and verify failure**

Run:

```bash
npm run test:run -- src/state/__tests__/useCohortDemo.test.tsx
```

Expected: FAIL because `src/state/useCohortDemo.ts` does not exist.

- [ ] **Step 3: Implement state hook**

Create `src/state/useCohortDemo.ts`:

```ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import { evaluateCohortSync } from '../domain/evaluator';
import { baselineRelationships, statusFromHealth } from '../domain/sampleCohort';
import type { CohortEvaluation, CohortSyncRow, Relationship } from '../domain/types';

export type DemoPhase = 'baseline' | 'processing' | 'processed' | 'error';

export type ProcessingStep = {
  id: 'parse' | 'evaluate' | 'graph' | 'summary';
  label: string;
  detail: string;
  status: 'pending' | 'active' | 'done';
};

const STORAGE_KEY = 'cohort-atlas-demo-state';

const BASE_STEPS: ProcessingStep[] = [
  { id: 'parse', label: 'Parse rows', detail: 'Validate monthly mentor-startup records', status: 'pending' },
  { id: 'evaluate', label: 'Evaluate fit', detail: 'Score time, confidence, milestones, and blockers', status: 'pending' },
  { id: 'graph', label: 'Update graph', detail: 'Prepare relationship health transitions', status: 'pending' },
  { id: 'summary', label: 'Prepare executive summary', detail: 'Draft cohort narrative and actions', status: 'pending' },
];

type PersistedState = {
  relationships: Relationship[];
  evaluation: CohortEvaluation | null;
};

function applyEvaluation(rows: CohortSyncRow[]) {
  const evaluation = evaluateCohortSync(rows);
  const relationships = baselineRelationships.map((relationship) => {
    const result = evaluation.relationshipEvaluations.find((item) => item.relationshipId === relationship.id);
    if (!result) return relationship;

    return {
      ...relationship,
      currentHealth: result.engagement_health,
      status: statusFromHealth(result.engagement_health),
      rationale: result.reasoning,
      recommendedAction: result.recommended_action,
      hoursSynced: rows.find((row) => `${row.mentor_id}:${row.startup_id}` === relationship.id)?.hours_synced ?? relationship.hoursSynced,
      lastSignal: result.signals.positive[0] ?? relationship.lastSignal,
    };
  });

  return { relationships, evaluation };
}

function readPersisted(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

export function useCohortDemo() {
  const persisted = useMemo(readPersisted, []);
  const [phase, setPhase] = useState<DemoPhase>(persisted ? 'processed' : 'baseline');
  const [relationships, setRelationships] = useState<Relationship[]>(persisted?.relationships ?? baselineRelationships);
  const [evaluation, setEvaluation] = useState<CohortEvaluation | null>(persisted?.evaluation ?? null);
  const [steps, setSteps] = useState<ProcessingStep[]>(BASE_STEPS);
  const [drawerOpen, setDrawerOpen] = useState(Boolean(persisted));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (phase === 'processed' && evaluation) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ relationships, evaluation }));
    }
  }, [evaluation, phase, relationships]);

  const markStep = useCallback((index: number) => {
    setSteps((current) =>
      current.map((step, stepIndex) => {
        if (stepIndex < index) return { ...step, status: 'done' };
        if (stepIndex === index) return { ...step, status: 'active' };
        return { ...step, status: 'pending' };
      }),
    );
  }, []);

  const processRows = useCallback(
    (rows: CohortSyncRow[]) => {
      setPhase('processing');
      setDrawerOpen(false);
      setErrorMessage(null);
      setSteps(BASE_STEPS.map((step) => ({ ...step })));

      [0, 1, 2, 3].forEach((stepIndex) => {
        window.setTimeout(() => markStep(stepIndex), stepIndex * 650);
      });

      window.setTimeout(() => {
        const next = applyEvaluation(rows);
        setRelationships(next.relationships);
        setEvaluation(next.evaluation);
        setSteps((current) => current.map((step) => ({ ...step, status: 'done' })));
        setPhase('processed');
        setDrawerOpen(true);
      }, 2800);
    },
    [markStep],
  );

  const failWithMessage = useCallback((message: string) => {
    setPhase('error');
    setErrorMessage(message);
  }, []);

  const resetDemo = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPhase('baseline');
    setRelationships(baselineRelationships);
    setEvaluation(null);
    setDrawerOpen(false);
    setErrorMessage(null);
    setSteps(BASE_STEPS.map((step) => ({ ...step })));
  }, []);

  return {
    phase,
    relationships,
    evaluation,
    steps,
    drawerOpen,
    errorMessage,
    setDrawerOpen,
    processRows,
    failWithMessage,
    resetDemo,
  };
}
```

- [ ] **Step 4: Verify state tests pass**

Run:

```bash
npm run test:run -- src/state/__tests__/useCohortDemo.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/state src/state/__tests__
git commit -m "feat: add persisted demo state"
```

## Task 4: Build Main App Shell, Metrics, Ingestion Panel, And Processing Timeline

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/AppShell.tsx`
- Create: `src/components/DashboardHeader.tsx`
- Create: `src/components/CohortMetrics.tsx`
- Create: `src/components/IngestionPanel.tsx`
- Create: `src/components/ProcessingTimeline.tsx`

- [ ] **Step 1: Implement dashboard header**

Create `src/components/DashboardHeader.tsx`:

```tsx
import type { DemoPhase } from '../state/useCohortDemo';

type Props = {
  phase: DemoPhase;
  onReset: () => void;
};

export function DashboardHeader({ phase, onReset }: Props) {
  const refreshed = phase === 'processed';

  return (
    <header className="border-b border-[#b7a98e] pb-5">
      <div className="flex items-start justify-between gap-8">
        <div>
          <div className="flex items-baseline gap-4">
            <h1 className="text-[46px] font-black leading-none text-[#17211c]">Cohort Atlas</h1>
            <span className="ui-sans text-[11px] font-black uppercase tracking-[0.08em] text-[#405047]">
              June cohort, {refreshed ? 'refreshed' : 'monthly sync'}
            </span>
          </div>
          <p className="mt-3 max-w-[850px] text-[22px] leading-[1.2] text-[#405047]">
            {refreshed
              ? 'Offline mentor records show improving fit. Two relationships need targeted program intervention.'
              : 'Four mentor relationships are losing signal. Process the raw monthly information to refresh cohort health.'}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onReset}
            className="ui-sans rounded-full border border-[#17211c] px-4 py-3 text-[11px] font-black uppercase tracking-[0.06em] text-[#17211c]"
          >
            Reset Demo
          </button>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Implement metrics**

Create `src/components/CohortMetrics.tsx`:

```tsx
import type { CohortEvaluation, Relationship } from '../domain/types';

type Props = {
  relationships: Relationship[];
  evaluation: CohortEvaluation | null;
};

function metricTone(index: number, value: number) {
  if (index === 0 && value >= 72) return 'bg-[#dce8dc] border-[#adc3ad]';
  if (index === 0 && value < 55) return 'bg-[#ecd1c8] border-[#c99a8e]';
  return 'bg-[#f6eedf] border-[#b7a98e]';
}

export function CohortMetrics({ relationships, evaluation }: Props) {
  const atRisk = relationships.filter((item) => item.status === 'at-risk').length;
  const improved = relationships.filter((item) => item.currentHealth > item.baselineHealth).length;
  const health =
    evaluation?.cohortHealth ??
    Math.round(relationships.reduce((sum, item) => sum + item.currentHealth, 0) / relationships.length);

  const metrics = evaluation
    ? [
        { value: health, label: 'Cohort Health' },
        { value: improved, label: 'Improved' },
        { value: atRisk, label: 'Still Flagged' },
        { value: `${evaluation.confidence}%`, label: 'Confidence' },
      ]
    : [
        { value: health, label: 'Cohort Health' },
        { value: atRisk, label: 'At Risk' },
        { value: '19d', label: 'Data Age' },
        { value: relationships.length, label: 'Active Edges' },
      ];

  return (
    <section className="grid grid-cols-4 gap-3">
      {metrics.map((metric, index) => (
        <div
          key={metric.label}
          className={`min-h-[104px] rounded-lg border p-4 ${metricTone(index, Number(metric.value) || 0)}`}
        >
          <div className="text-[42px] font-black leading-none text-[#17211c]">{metric.value}</div>
          <div className="ui-sans mt-4 text-[10px] font-black uppercase tracking-[0.08em] text-[#405047]">
            {metric.label}
          </div>
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 3: Implement processing timeline**

Create `src/components/ProcessingTimeline.tsx`:

```tsx
import type { ProcessingStep } from '../state/useCohortDemo';

type Props = {
  steps: ProcessingStep[];
};

export function ProcessingTimeline({ steps }: Props) {
  return (
    <div className="border-t border-[rgba(246,238,223,0.18)]">
      {steps.map((step, index) => (
        <div
          key={step.id}
          className="flex min-h-[62px] items-center justify-between gap-4 border-b border-[rgba(246,238,223,0.18)] py-3"
        >
          <div>
            <strong className="block text-[17px] leading-tight text-[#f6eedf]">{step.label}</strong>
            <span className="ui-sans mt-1 block text-xs leading-snug text-[rgba(246,238,223,0.62)]">{step.detail}</span>
          </div>
          <div
            className={`grid h-8 w-8 place-items-center rounded-full border text-sm font-black ${
              step.status === 'done'
                ? 'border-[#f6eedf] bg-[#f6eedf] text-[#315f4d]'
                : step.status === 'active'
                  ? 'border-[#f6eedf] text-[#f6eedf]'
                  : 'border-[rgba(246,238,223,0.34)] text-[rgba(246,238,223,0.7)]'
            }`}
          >
            {step.status === 'done' ? '✓' : index + 1}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Implement ingestion panel**

Create `src/components/IngestionPanel.tsx`:

```tsx
import { Upload } from 'lucide-react';
import { parseCohortCsv } from '../domain/csv';
import type { CohortSyncRow } from '../domain/types';
import type { DemoPhase, ProcessingStep } from '../state/useCohortDemo';
import { ProcessingTimeline } from './ProcessingTimeline';

type Props = {
  phase: DemoPhase;
  steps: ProcessingStep[];
  errorMessage: string | null;
  onRows: (rows: CohortSyncRow[]) => void;
  onError: (message: string) => void;
};

export function IngestionPanel({ phase, steps, errorMessage, onRows, onError }: Props) {
  async function loadSample() {
    const response = await fetch('/monthly-sync-sample.csv');
    const text = await response.text();
    const result = parseCohortCsv(text);
    if (result.ok) onRows(result.rows);
    else onError(result.message);
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      onError('Upload a monthly sync CSV file.');
      return;
    }
    const text = await file.text();
    const result = parseCohortCsv(text);
    if (result.ok) onRows(result.rows);
    else onError(result.message);
  }

  return (
    <aside className="rounded-lg border border-[#17211c] bg-[#17211c] p-5 text-[#f6eedf]">
      <div className="ui-sans text-[10px] font-black uppercase tracking-[0.08em] text-[rgba(246,238,223,0.66)]">
        Offline intelligence pass
      </div>
      <h2 className="mt-3 text-[34px] font-black leading-none">Process Raw Information</h2>
      <p className="ui-sans mt-3 text-sm leading-relaxed text-[rgba(246,238,223,0.72)]">
        Upload the monthly mentor sync export. Cohort Atlas will parse the records and update relationship health.
      </p>

      <label
        className="mt-5 grid min-h-[116px] cursor-pointer content-center gap-3 rounded-lg border border-dashed border-[rgba(246,238,223,0.45)] p-4"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void handleFile(event.dataTransfer.files[0]);
        }}
      >
        <input
          className="sr-only"
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => void handleFile(event.currentTarget.files?.[0])}
        />
        <Upload size={20} />
        <span className="ui-sans text-xs font-black uppercase tracking-[0.08em] text-[rgba(246,238,223,0.72)]">
          Drop CSV here or choose file
        </span>
      </label>

      <button
        type="button"
        onClick={() => void loadSample()}
        className="ui-sans mt-4 w-full rounded-full border border-[#f6eedf] bg-[#f6eedf] px-4 py-3 text-[11px] font-black uppercase tracking-[0.06em] text-[#17211c]"
      >
        Use Sample CSV
      </button>

      {phase === 'processing' ? <div className="mt-6"><ProcessingTimeline steps={steps} /></div> : null}
      {errorMessage ? <p className="ui-sans mt-4 rounded-lg bg-[#ecd1c8] p-3 text-sm text-[#a14634]">{errorMessage}</p> : null}
    </aside>
  );
}
```

- [ ] **Step 5: Implement app shell**

Create `src/components/AppShell.tsx`:

```tsx
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export function AppShell({ children }: Props) {
  return (
    <div className="min-h-screen bg-[#ede4d1] p-6 text-[#17211c]">
      <div className="mx-auto max-w-[1520px]">{children}</div>
    </div>
  );
}
```

- [ ] **Step 6: Wire shell in App temporarily**

Modify `src/App.tsx`:

```tsx
import { AppShell } from './components/AppShell';
import { CohortMetrics } from './components/CohortMetrics';
import { DashboardHeader } from './components/DashboardHeader';
import { IngestionPanel } from './components/IngestionPanel';
import { useCohortDemo } from './state/useCohortDemo';

export default function App() {
  const demo = useCohortDemo();

  return (
    <AppShell>
      <DashboardHeader phase={demo.phase} onReset={demo.resetDemo} />
      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_420px] gap-5">
        <main>
          <CohortMetrics relationships={demo.relationships} evaluation={demo.evaluation} />
          <div className="mt-4 rounded-lg border border-[#b7a98e] bg-[#f6eedf] p-8">
            <p className="ui-sans text-sm font-bold uppercase tracking-[0.08em] text-[#405047]">
              Graph surface lands in Task 5
            </p>
          </div>
        </main>
        <IngestionPanel
          phase={demo.phase}
          steps={demo.steps}
          errorMessage={demo.errorMessage}
          onRows={demo.processRows}
          onError={demo.failWithMessage}
        />
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 7: Verify build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add src/App.tsx src/components
git commit -m "feat: add Cohort Atlas dashboard shell"
```

## Task 5: Build React Flow Graph And Graph View Model

**Files:**
- Create: `src/domain/graphViewModel.ts`
- Create: `src/domain/__tests__/graphViewModel.test.ts`
- Create: `src/components/CohortGraph.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write graph view model tests first**

Create `src/domain/__tests__/graphViewModel.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { relationshipsToGraph } from '../graphViewModel';
import { baselineRelationships, mentors, startups } from '../sampleCohort';

describe('relationshipsToGraph', () => {
  it('creates mentor and startup nodes plus relationship edges', () => {
    const graph = relationshipsToGraph(baselineRelationships, mentors, startups);
    expect(graph.nodes.some((node) => node.id === 'M-104')).toBe(true);
    expect(graph.nodes.some((node) => node.id === 'S-LOOP')).toBe(true);
    expect(graph.edges.some((edge) => edge.id === 'M-104:S-LOOP')).toBe(true);
  });

  it('marks at-risk relationships with red edge classes', () => {
    const graph = relationshipsToGraph(baselineRelationships, mentors, startups);
    const edge = graph.edges.find((item) => item.id === 'M-104:S-LOOP');
    expect(edge?.className).toContain('edge-risk');
  });
});
```

- [ ] **Step 2: Run graph view model tests and verify failure**

Run:

```bash
npm run test:run -- src/domain/__tests__/graphViewModel.test.ts
```

Expected: FAIL because `src/domain/graphViewModel.ts` does not exist.

- [ ] **Step 3: Implement graph view model**

Create `src/domain/graphViewModel.ts`:

```ts
import type { Edge, Node } from '@xyflow/react';
import type { Mentor, Relationship, Startup } from './types';

const mentorPositions: Record<string, { x: number; y: number }> = {
  'M-104': { x: 70, y: 72 },
  'M-207': { x: 520, y: 60 },
  'M-116': { x: 110, y: 300 },
  'M-319': { x: 760, y: 96 },
  'M-058': { x: 700, y: 310 },
  'M-221': { x: 420, y: 340 },
  'M-410': { x: 280, y: 94 },
};

const startupPositions: Record<string, { x: number; y: number }> = {
  'S-LOOP': { x: 410, y: 170 },
  'S-ORBIT': { x: 660, y: 230 },
  'S-NORTH': { x: 250, y: 250 },
  'S-KIN': { x: 610, y: 145 },
  'S-PULSE': { x: 500, y: 285 },
  'S-HELIOS': { x: 330, y: 380 },
};

function edgeClass(status: Relationship['status']) {
  if (status === 'at-risk') return 'edge-risk';
  if (status === 'watch') return 'edge-watch';
  return 'edge-healthy';
}

function nodeClass(status: Relationship['status']) {
  if (status === 'at-risk') return 'node-risk';
  if (status === 'watch') return 'node-watch';
  return 'node-healthy';
}

export function relationshipsToGraph(relationships: Relationship[], mentors: Mentor[], startups: Startup[]) {
  const connectedMentors = new Set(relationships.map((relationship) => relationship.mentorId));
  const connectedStartups = new Set(relationships.map((relationship) => relationship.startupId));

  const nodes: Node[] = [
    ...mentors
      .filter((mentor) => connectedMentors.has(mentor.id))
      .map((mentor) => ({
        id: mentor.id,
        type: 'default',
        position: mentorPositions[mentor.id],
        data: { label: mentor.name, subtitle: mentor.domain, kind: 'Mentor' },
        className: 'atlas-node node-mentor',
      })),
    ...startups
      .filter((startup) => connectedStartups.has(startup.id))
      .map((startup) => {
        const related = relationships.find((relationship) => relationship.startupId === startup.id);
        return {
          id: startup.id,
          type: 'default',
          position: startupPositions[startup.id],
          data: { label: startup.name, subtitle: startup.stage, kind: 'Startup' },
          className: `atlas-node ${nodeClass(related?.status ?? 'healthy')}`,
        };
      }),
  ];

  const edges: Edge[] = relationships.map((relationship) => ({
    id: relationship.id,
    source: relationship.mentorId,
    target: relationship.startupId,
    animated: relationship.currentHealth > relationship.baselineHealth,
    label: `${relationship.currentHealth}`,
    className: edgeClass(relationship.status),
    data: { relationshipId: relationship.id },
  }));

  return { nodes, edges };
}
```

- [ ] **Step 4: Implement graph component**

Create `src/components/CohortGraph.tsx`:

```tsx
import { Background, ReactFlow } from '@xyflow/react';
import { useMemo } from 'react';
import { relationshipsToGraph } from '../domain/graphViewModel';
import { mentors, startups } from '../domain/sampleCohort';
import type { Relationship } from '../domain/types';

type Props = {
  relationships: Relationship[];
  onSelectRelationship: (relationshipId: string) => void;
};

export function CohortGraph({ relationships, onSelectRelationship }: Props) {
  const { nodes, edges } = useMemo(() => relationshipsToGraph(relationships, mentors, startups), [relationships]);

  return (
    <section className="overflow-hidden rounded-lg border border-[#b7a98e] bg-[#f6eedf]">
      <div className="flex items-center justify-between border-b border-[#b7a98e] px-4 py-3">
        <div>
          <div className="ui-sans text-[10px] font-black uppercase tracking-[0.08em] text-[#405047]">
            Relationship graph
          </div>
          <h2 className="text-[22px] font-black leading-tight">Updated mentor-startup signal</h2>
        </div>
        <div className="ui-sans rounded-full bg-[#dce8dc] px-3 py-2 text-[10px] font-black uppercase tracking-[0.08em] text-[#315f4d]">
          Health encoded
        </div>
      </div>
      <div className="h-[430px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          panOnScroll={false}
          zoomOnScroll={false}
          onEdgeClick={(_, edge) => {
            const relationshipId = String(edge.data?.relationshipId ?? edge.id);
            onSelectRelationship(relationshipId);
          }}
        >
          <Background color="#cfc2a9" gap={42} />
        </ReactFlow>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Add graph styling**

Append to `src/styles.css`:

```css
.atlas-node {
  width: 126px;
  min-height: 58px;
  border-radius: 8px;
  border: 1px solid #315f4d;
  background: #dce8dc;
  color: #17211c;
  box-shadow: 0 6px 0 rgba(23, 33, 28, 0.08);
  font-family: Charter, "Iowan Old Style", "Hoefler Text", Georgia, serif;
}

.atlas-node .react-flow__node-default {
  border: 0;
}

.node-risk {
  border-color: #a14634;
  background: #ecd1c8;
}

.node-watch {
  border-color: #b8832d;
  background: #f1dfb7;
}

.node-mentor {
  background: #e6dbc5;
}

.edge-risk path {
  stroke: #a14634;
  stroke-width: 3;
}

.edge-watch path {
  stroke: #b8832d;
  stroke-width: 2.5;
}

.edge-healthy path {
  stroke: #315f4d;
  stroke-width: 2.5;
}

.react-flow__edge-textbg {
  fill: #f6eedf;
}

.react-flow__edge-text {
  fill: #17211c;
  font-family: "Avenir Next", "Gill Sans", sans-serif;
  font-size: 11px;
  font-weight: 800;
}
```

- [ ] **Step 6: Wire graph into App**

Modify `src/App.tsx` to replace the temporary graph block with:

```tsx
import { useState } from 'react';
import { CohortGraph } from './components/CohortGraph';
```

Inside `App`, add:

```tsx
const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null);
```

Replace the temporary graph panel with:

```tsx
<div className="mt-4">
  <CohortGraph relationships={demo.relationships} onSelectRelationship={setSelectedRelationshipId} />
</div>
```

Keep `selectedRelationshipId` unused until Task 6. TypeScript may complain, so temporarily add:

```tsx
void selectedRelationshipId;
```

- [ ] **Step 7: Verify tests and build**

Run:

```bash
npm run test:run -- src/domain/__tests__/graphViewModel.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add src/domain/graphViewModel.ts src/domain/__tests__/graphViewModel.test.ts src/components/CohortGraph.tsx src/App.tsx src/styles.css
git commit -m "feat: add cohort relationship graph"
```

## Task 6: Build Executive Insight Drawer And Relationship Details

**Files:**
- Create: `src/components/InsightDrawer.tsx`
- Create: `src/components/RelationshipCard.tsx`
- Create: `src/components/StatusLegend.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create relationship card**

Create `src/components/RelationshipCard.tsx`:

```tsx
import type { RelationshipEvaluation } from '../domain/types';

type Props = {
  evaluation: RelationshipEvaluation;
};

export function RelationshipCard({ evaluation }: Props) {
  return (
    <article className="border-t border-[#b7a98e] py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-[17px] font-black leading-tight">{evaluation.relationshipId.replace(':', ' → ')}</h4>
          <p className="ui-sans mt-2 text-sm leading-snug text-[#405047]">{evaluation.reasoning}</p>
        </div>
        <span className="ui-sans shrink-0 rounded-full bg-[#dce8dc] px-3 py-2 text-[10px] font-black uppercase tracking-[0.08em] text-[#315f4d]">
          {evaluation.previous_health} → {evaluation.engagement_health}
        </span>
      </div>
      <p className="ui-sans mt-3 text-xs font-bold uppercase tracking-[0.08em] text-[#405047]">
        Action: {evaluation.recommended_action}
      </p>
    </article>
  );
}
```

- [ ] **Step 2: Create status legend**

Create `src/components/StatusLegend.tsx`:

```tsx
const items = [
  { label: 'Healthy', color: '#315f4d' },
  { label: 'Watch', color: '#b8832d' },
  { label: 'At risk', color: '#a14634' },
];

export function StatusLegend() {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <div key={item.label} className="ui-sans flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.08em] text-[#405047]">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          {item.label}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create insight drawer**

Create `src/components/InsightDrawer.tsx`:

```tsx
import type { CohortEvaluation, Relationship } from '../domain/types';
import { RelationshipCard } from './RelationshipCard';

type Props = {
  open: boolean;
  evaluation: CohortEvaluation | null;
  selectedRelationship: Relationship | null;
  onClose: () => void;
};

export function InsightDrawer({ open, evaluation, selectedRelationship, onClose }: Props) {
  if (!open) return null;

  return (
    <aside className="rounded-lg border border-[#17211c] bg-[#f6eedf]">
      <div className="border-b border-[#b7a98e] p-5">
        <div className="ui-sans text-[10px] font-black uppercase tracking-[0.08em] text-[#405047]">
          {selectedRelationship ? 'Relationship detail' : 'Executive summary'}
        </div>
        <div className="mt-2 flex items-start justify-between gap-4">
          <h3 className="text-[34px] font-black leading-none">
            {selectedRelationship ? 'Selected relationship signal.' : 'Cohort signal has materially improved.'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="ui-sans rounded-full border border-[#17211c] px-3 py-2 text-[10px] font-black uppercase tracking-[0.08em]"
          >
            Close
          </button>
        </div>
        <p className="ui-sans mt-3 text-sm leading-relaxed text-[#405047]">
          {selectedRelationship?.rationale ??
            evaluation?.executiveSummary ??
            'Process raw information to generate the cohort narrative and relationship actions.'}
        </p>
      </div>

      {evaluation ? (
        <>
          <div className="grid grid-cols-2 gap-3 border-b border-[#b7a98e] p-5">
            <div className="rounded-lg border border-[#b7a98e] bg-[#ede4d1] p-4">
              <div className="ui-sans text-[10px] font-black uppercase tracking-[0.08em] text-[#405047]">Health delta</div>
              <strong className="mt-2 block text-[30px] leading-none">+28</strong>
            </div>
            <div className="rounded-lg border border-[#b7a98e] bg-[#ede4d1] p-4">
              <div className="ui-sans text-[10px] font-black uppercase tracking-[0.08em] text-[#405047]">Rows processed</div>
              <strong className="mt-2 block text-[30px] leading-none">{evaluation.processedRows}</strong>
            </div>
          </div>
          <div className="px-5 pb-2">
            {evaluation.relationshipEvaluations.slice(0, 4).map((item) => (
              <RelationshipCard key={item.relationshipId} evaluation={item} />
            ))}
          </div>
        </>
      ) : null}
    </aside>
  );
}
```

- [ ] **Step 4: Wire drawer into App**

Modify `src/App.tsx` imports:

```tsx
import { InsightDrawer } from './components/InsightDrawer';
import { StatusLegend } from './components/StatusLegend';
```

Inside `App`, derive:

```tsx
const selectedRelationship =
  demo.relationships.find((relationship) => relationship.id === selectedRelationshipId) ?? null;
```

Modify the main grid to use:

```tsx
<div className="mt-5 grid grid-cols-[minmax(0,1fr)_450px] gap-5">
```

Place `StatusLegend` below metrics:

```tsx
<div className="mt-3">
  <StatusLegend />
</div>
```

Replace the right column with:

```tsx
<div className="space-y-4">
  <IngestionPanel
    phase={demo.phase}
    steps={demo.steps}
    errorMessage={demo.errorMessage}
    onRows={demo.processRows}
    onError={demo.failWithMessage}
  />
  <InsightDrawer
    open={demo.drawerOpen || Boolean(selectedRelationship)}
    evaluation={demo.evaluation}
    selectedRelationship={selectedRelationship}
    onClose={() => {
      setSelectedRelationshipId(null);
      demo.setDrawerOpen(false);
    }}
  />
</div>
```

- [ ] **Step 5: Verify build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/App.tsx src/components/InsightDrawer.tsx src/components/RelationshipCard.tsx src/components/StatusLegend.tsx
git commit -m "feat: add executive insight drawer"
```

## Task 7: Polish App Composition To Match Selected UI Sample 3

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/CohortGraph.tsx`
- Modify: `src/components/IngestionPanel.tsx`
- Modify: `src/components/InsightDrawer.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Make post-ingestion review the destination state**

Modify `src/App.tsx` so the right side prioritizes the drawer once processed:

```tsx
const rightRail = demo.phase === 'processed' ? (
  <div className="space-y-4">
    <InsightDrawer
      open
      evaluation={demo.evaluation}
      selectedRelationship={selectedRelationship}
      onClose={() => {
        setSelectedRelationshipId(null);
        demo.setDrawerOpen(false);
      }}
    />
    <IngestionPanel
      phase={demo.phase}
      steps={demo.steps}
      errorMessage={demo.errorMessage}
      onRows={demo.processRows}
      onError={demo.failWithMessage}
    />
  </div>
) : (
  <div className="space-y-4">
    <IngestionPanel
      phase={demo.phase}
      steps={demo.steps}
      errorMessage={demo.errorMessage}
      onRows={demo.processRows}
      onError={demo.failWithMessage}
    />
    <InsightDrawer
      open={Boolean(selectedRelationship)}
      evaluation={demo.evaluation}
      selectedRelationship={selectedRelationship}
      onClose={() => setSelectedRelationshipId(null)}
    />
  </div>
);
```

Render `{rightRail}` as the second grid column.

- [ ] **Step 2: Add processed-state emphasis to graph heading**

Modify `src/components/CohortGraph.tsx` props:

```tsx
type Props = {
  relationships: Relationship[];
  processed: boolean;
  onSelectRelationship: (relationshipId: string) => void;
};
```

Use `processed` in the heading:

```tsx
<h2 className="text-[22px] font-black leading-tight">
  {processed ? 'Updated after raw information pass' : 'Stale signal before monthly update'}
</h2>
```

Update `App.tsx` call:

```tsx
<CohortGraph
  relationships={demo.relationships}
  processed={demo.phase === 'processed'}
  onSelectRelationship={setSelectedRelationshipId}
/>
```

- [ ] **Step 3: Add crisp transition CSS**

Append to `src/styles.css`:

```css
.atlas-node,
.react-flow__edge path,
button,
.transition-surface {
  transition:
    background-color 180ms ease-out,
    border-color 180ms ease-out,
    color 180ms ease-out,
    opacity 180ms ease-out,
    transform 180ms ease-out;
}

button:focus-visible,
input:focus-visible {
  outline: 2px solid #2d526e;
  outline-offset: 3px;
}
```

- [ ] **Step 4: Verify no visual dependency on remote assets**

Run:

```bash
rg -n "https?://|fonts.googleapis|unsplash|cloudinary" src public index.html
```

Expected: no matches.

- [ ] **Step 5: Verify build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/App.tsx src/components/CohortGraph.tsx src/components/IngestionPanel.tsx src/components/InsightDrawer.tsx src/styles.css
git commit -m "style: polish Cohort Atlas review flow"
```

## Task 8: Add No-Gradient Audit And Final Verification

**Files:**
- Create: `scripts/check-no-gradients.mjs`
- Modify: `package.json`

- [ ] **Step 1: Add no-gradient audit script**

Create `scripts/check-no-gradients.mjs`:

```js
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['src', 'public'];
const FORBIDDEN = [
  'linear-gradient',
  'radial-gradient',
  'conic-gradient',
  'repeating-linear-gradient',
  'repeating-radial-gradient',
  'background-clip: text',
];

function filesUnder(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return filesUnder(path);
    return [path];
  });
}

const files = ROOTS.flatMap(filesUnder).filter((file) => /\.(css|tsx|ts|html|svg)$/.test(file));
const failures = [];

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  for (const token of FORBIDDEN) {
    if (content.includes(token)) {
      failures.push(`${file}: contains ${token}`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`No gradient usage found across ${files.length} files.`);
```

- [ ] **Step 2: Run full automated checks**

Run:

```bash
npm run test:run
npm run check:no-gradients
npm run build
```

Expected:

```text
Test Files  4 passed
No gradient usage found across ...
vite build completes successfully
```

- [ ] **Step 3: Start local dev server**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Vite prints a local URL, typically `http://127.0.0.1:5173/`.

- [ ] **Step 4: Browser visual verification**

Use the in-app browser at the Vite URL and verify:

```text
1. First screen shows Cohort Atlas, baseline graph, metrics, and Process Raw Information.
2. There are no CSS gradients or remote image/font loads.
3. Use Sample CSV starts a fast processing sequence.
4. Processing completes in roughly 6-10 seconds.
5. The graph health visually improves.
6. The right rail becomes the executive insight review, matching UI sample 3.
7. Clicking a graph relationship opens relationship reasoning.
8. Reset Demo returns to the baseline graph and ingestion prompt.
9. Large display layout has no overlapping text, clipped labels, or awkward empty areas.
```

- [ ] **Step 5: Commit final audit**

Run:

```bash
git add scripts/check-no-gradients.mjs package.json package-lock.json
git commit -m "test: add no-gradient audit"
```

## Final Acceptance Criteria

- Local app runs with `npm run dev`.
- App works without remote fonts, remote images, live Supabase, or live Gemini.
- Baseline graph is visible on first load.
- CTA says `Process Raw Information`.
- Sample CSV path works.
- Drag-and-drop CSV path works for valid CSV.
- Invalid CSV shows polished executive copy.
- Processing feels crisp, not slow.
- Graph transforms from risk-heavy to healthier.
- Executive drawer opens after processing and leads with cohort-level summary.
- Reset control returns to baseline.
- No CSS gradients are present.
- `npm run test:run`, `npm run check:no-gradients`, and `npm run build` pass.
