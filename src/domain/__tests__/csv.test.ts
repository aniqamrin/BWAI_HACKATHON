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
    const result = parseCohortCsv('mentor_id,startup_id,hours_synced\nM-104,S-LOOP,7');
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

  it('rejects blank required text cells', () => {
    const result = parseCohortCsv(`mentor_id,startup_id,hours_synced,milestones_completed,blockers_identified,founder_confidence_score,mentor_confidence_score
 ,S-LOOP,7,Drafted GTM strategy,Enterprise intro blocked,8,8`);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe('mentor_id is required on row 2.');
    }
  });
});
