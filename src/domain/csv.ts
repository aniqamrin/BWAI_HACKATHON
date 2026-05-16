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

function validateRequiredText(value: unknown, column: string, rowNumber: number): ParseFailure | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return { ok: false, message: `${column} is required on row ${rowNumber}.` };
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

    const requiredTextError =
      validateRequiredText(raw.mentor_id, 'mentor_id', rowNumber) ??
      validateRequiredText(raw.startup_id, 'startup_id', rowNumber) ??
      validateRequiredText(raw.milestones_completed, 'milestones_completed', rowNumber) ??
      validateRequiredText(raw.blockers_identified, 'blockers_identified', rowNumber);
    if (requiredTextError) return requiredTextError;

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
