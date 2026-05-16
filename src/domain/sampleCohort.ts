import type { HealthStatus, Mentor, Relationship, Startup } from './types';

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

export function statusFromHealth(score: number): HealthStatus {
  if (score >= 72) return 'healthy';
  if (score >= 50) return 'watch';
  return 'at-risk';
}
