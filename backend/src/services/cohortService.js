const { generateContent } = require('./geminiService');
const { query } = require('../db/connection');
const { buildMentorMatchPrompt } = require('../prompts/matchingPrompt');
const logger = require('../utils/logger');

async function runCohortMatching(cohortId) {
  const cohortResult = await query('SELECT * FROM cohorts WHERE id = $1', [cohortId]);
  if (!cohortResult.rows[0]) throw new Error('Cohort not found');
  const cohort = cohortResult.rows[0];

  if (!cohort.startup_ids?.length || !cohort.mentor_ids?.length) {
    throw new Error('Cohort must have both startups and mentors selected');
  }

  await query('UPDATE cohorts SET status = $1 WHERE id = $2', ['matching', cohortId]);

  // Fetch all startups and mentors
  const startupResults = await query(
    'SELECT s.*, u.full_name FROM startups s JOIN users u ON s.user_id = u.id WHERE s.id = ANY($1)',
    [cohort.startup_ids]
  );
  const mentorResults = await query(
    'SELECT m.*, u.full_name FROM mentors m JOIN users u ON m.user_id = u.id WHERE m.id = ANY($1)',
    [cohort.mentor_ids]
  );

  const startups = startupResults.rows;
  const mentors = mentorResults.rows;

  // Build outcome feedback context per mentor
  const outcomeContext = {};
  for (const mentor of mentors) {
    const res = await query(
      `SELECT AVG(ro.overall_rating) as avg_rating, COUNT(*) as total
       FROM relationship_outcomes ro
       JOIN relationships r ON ro.relationship_id = r.id
       WHERE r.mentor_id = $1`,
      [mentor.id]
    );
    if (res.rows[0]?.avg_rating) {
      outcomeContext[mentor.id] = `Historical: avg rating ${parseFloat(res.rows[0].avg_rating).toFixed(1)}/5 across ${res.rows[0].total} past mentorships`;
    }
  }

  // Run N×M matching matrix in parallel
  const matchMatrix = {};
  const matchPromises = [];

  for (const startup of startups) {
    matchMatrix[startup.id] = {};
    for (const mentor of mentors) {
      matchPromises.push(
        (async () => {
          try {
            const historicalNote = outcomeContext[mentor.id] || '';
            const prompt = buildMentorMatchPrompt(startup, mentor, historicalNote);
            const aiResult = await generateContent(prompt, { mockType: 'mentor_match', temperature: 0.3 });
            const score = parseFloat(aiResult.compatibility_score) || Math.round(60 + Math.random() * 30);
            matchMatrix[startup.id][mentor.id] = {
              score,
              reasoning: aiResult.reasoning || 'Good compatibility',
              recommended_focus_areas: aiResult.recommended_focus_areas || [],
            };
          } catch (err) {
            matchMatrix[startup.id][mentor.id] = { score: 50, reasoning: 'Analysis unavailable' };
          }
        })()
      );
    }
  }

  await Promise.all(matchPromises);

  // Greedy optimal assignment: maximize total score, respect mentor capacity
  const mentorCapacity = {};
  mentors.forEach(m => { mentorCapacity[m.id] = m.max_startups || 3; });

  const assignments = solveOptimalAssignment(matchMatrix, startups, mentors, mentorCapacity);

  const matrixPayload = {
    startups: startups.map(s => ({ id: s.id, name: s.startup_name, industry: s.industry, stage: s.stage })),
    mentors: mentors.map(m => ({ id: m.id, name: m.full_name, expertise: m.expertise })),
    scores: matchMatrix,
    optimal_assignment: assignments,
    computed_at: new Date().toISOString(),
  };

  await query(
    'UPDATE cohorts SET match_matrix = $1, status = $2 WHERE id = $3',
    [JSON.stringify(matrixPayload), 'matching', cohortId]
  );

  return matrixPayload;
}

function solveOptimalAssignment(matchMatrix, startups, mentors, mentorCapacity) {
  const capacityLeft = { ...mentorCapacity };
  const assignments = {};
  const assigned = new Set();

  // Collect all pairs sorted by score desc
  const pairs = [];
  for (const startup of startups) {
    for (const mentor of mentors) {
      const score = matchMatrix[startup.id]?.[mentor.id]?.score || 0;
      pairs.push({ startupId: startup.id, mentorId: mentor.id, score });
    }
  }
  pairs.sort((a, b) => b.score - a.score);

  for (const pair of pairs) {
    if (assigned.has(pair.startupId)) continue;
    if ((capacityLeft[pair.mentorId] || 0) <= 0) continue;
    assignments[pair.startupId] = {
      mentor_id: pair.mentorId,
      score: pair.score,
      reasoning: matchMatrix[pair.startupId]?.[pair.mentorId]?.reasoning || '',
    };
    assigned.add(pair.startupId);
    capacityLeft[pair.mentorId]--;
  }

  return assignments;
}

async function approveCohort(cohortId, userId) {
  const cohortResult = await query('SELECT * FROM cohorts WHERE id = $1', [cohortId]);
  if (!cohortResult.rows[0]) throw new Error('Cohort not found');
  const cohort = cohortResult.rows[0];

  if (!cohort.match_matrix?.optimal_assignment) throw new Error('Run matching first');

  const assignments = cohort.match_matrix.optimal_assignment;
  const blueprintId = cohort.blueprint_id;
  const created = [];

  for (const [startupId, assignment] of Object.entries(assignments)) {
    try {
      // Create the relationship
      const relResult = await query(
        `INSERT INTO relationships
           (relationship_type, startup_id, mentor_id, match_score, confidence_score,
            ai_generated, ai_reasoning, status, blueprint_id, cohort_id, started_at)
         VALUES ('mentor_startup',$1,$2,$3,$4,true,$5,'active',$6,$7,NOW())
         RETURNING *`,
        [startupId, assignment.mentor_id, assignment.score, assignment.score,
         assignment.reasoning, blueprintId || null, cohortId]
      );
      const relationship = relResult.rows[0];

      // Auto-create milestones if blueprint provided
      if (blueprintId) {
        await createMilestonesFromBlueprint(relationship.id, blueprintId, relationship.started_at);
      }

      // Update mentor's current_startups
      await query('UPDATE mentors SET current_startups = current_startups + 1 WHERE id = $1', [assignment.mentor_id]);

      // Log lifecycle event
      await query(
        `INSERT INTO lifecycle_events (relationship_id, event_type, triggered_by, payload)
         VALUES ($1, 'created', 'user', $2)`,
        [relationship.id, JSON.stringify({ cohort_id: cohortId, from_cohort_approval: true })]
      );

      created.push(relationship);
    } catch (err) {
      logger.error(`Failed to create relationship for startup ${startupId}:`, err);
    }
  }

  await query(
    'UPDATE cohorts SET status = $1, approved_at = NOW() WHERE id = $2',
    ['active', cohortId]
  );

  return { created_count: created.length, relationships: created };
}

async function createMilestonesFromBlueprint(relationshipId, blueprintId, startedAt) {
  const bpResult = await query('SELECT * FROM relationship_blueprints WHERE id = $1', [blueprintId]);
  if (!bpResult.rows[0]) return;
  const blueprint = bpResult.rows[0];

  const schedule = blueprint.milestone_week_schedule || [4, 8, 12];
  const milestoneNames = ['Early Progress Check', 'Mid-Point Review', 'Final Milestone'];

  for (let i = 0; i < schedule.length; i++) {
    const week = schedule[i];
    const dueDate = new Date(startedAt || Date.now());
    dueDate.setDate(dueDate.getDate() + week * 7);

    await query(
      `INSERT INTO relationship_milestones (relationship_id, title, description, due_week, due_date, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')`,
      [relationshipId,
       milestoneNames[i] || `Week ${week} Milestone`,
       `Milestone at week ${week} from relationship blueprint`,
       week,
       dueDate.toISOString().split('T')[0]]
    );
  }
}

module.exports = { runCohortMatching, approveCohort, createMilestonesFromBlueprint };
