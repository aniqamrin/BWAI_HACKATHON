const express = require('express');
const ecosystemRoutes = require('../src/routes/ecosystems');

async function main() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use('/api/ecosystems', ecosystemRoutes);

  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  const port = server.address().port;
  const base = `http://127.0.0.1:${port}/api/ecosystems/demo-smoke`;

  try {
    const processRes = await fetch(`${base}/evidence/process`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        csvText:
          'mentor_id,startup_id,hours_synced,milestones_completed,blockers_identified,founder_confidence_score,mentor_confidence_score\n' +
          'mentor_priya,startup_atlas,5.5,Procurement mapped,Security review stuck,8,9',
        whatsappText:
          '12/05/2026, 09:10 - Priya: Please send the security notes.\n' +
          '12/05/2026, 10:12 - Atlas Founder: We are stuck on security review but made progress. Thanks.',
      }),
    });
    const processed = await processRes.json();

    const mentorRes = await fetch(`${base}/rank/mentors`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ startupId: 'startup_atlas' }),
    });
    const mentors = await mentorRes.json();

    const partnerAliasRes = await fetch(`${base}/rank-partners`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ startupId: 'startup_atlas' }),
    });
    const partners = await partnerAliasRes.json();

    const snapshotRes = await fetch(`${base}/snapshot`);
    const snapshot = await snapshotRes.json();

    const contractRes = await fetch(`http://127.0.0.1:${port}/api/ecosystems/contract`);
    const contract = await contractRes.json();

    if (!processRes.ok || !processed.success) throw new Error('processEvidence failed');
    if (!mentorRes.ok || !mentors.success) throw new Error('rankMentors failed');
    if (!partnerAliasRes.ok || !partners.success) throw new Error('rankPartners alias failed');
    if (!snapshotRes.ok || !snapshot.success) throw new Error('getEcosystemSnapshot failed');
    if (!contractRes.ok || !contract.data?.aliases?.processEvidence) throw new Error('API contract endpoint failed');
    if (processed.data.evidenceSources.length < 2) throw new Error('Expected at least two evidence sources');
    if (!snapshot.data.recommendations.every((rec) => rec.evidenceSourceIds?.length > 0)) {
      throw new Error('Recommendations must link to evidenceSourceIds');
    }

    console.log(JSON.stringify({
      mode: 'demo',
      usesMockFallbackWhenCredentialsAreMissing: true,
      evidenceSources: processed.data.evidenceSources.length,
      actors: snapshot.data.actors.length,
      recommendations: snapshot.data.recommendations.length,
      mentorRankings: mentors.data.rankings.length,
      partnerRankings: partners.data.rankings.length,
      contractAliases: Object.keys(contract.data.aliases).length,
    }, null, 2));
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
