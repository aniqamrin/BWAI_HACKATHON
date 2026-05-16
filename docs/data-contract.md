# Cohort Atlas Data Contract

The demo reads from one canonical snapshot in `src/data/ecosystemData.ts`.
Every visible section uses shared IDs for actors, evidence sources, lenses, recommendations, rankings, and decisions.

## Current Local Mode

- `mockEcosystemSnapshot` is the source of truth for the local hackathon demo.
- `createMockEcosystemDataGateway()` exposes the same shape a real backend will return.
- `validateEcosystemSnapshot()` fails when a lens, ranking, map node, evidence card, or recommendation references a missing ID.

## Firebase-Ready Shape

Firestore collections:

- `ecosystems/{ecosystemId}`
- `ecosystems/{ecosystemId}/actors/{actorId}`
- `ecosystems/{ecosystemId}/evidenceSources/{evidenceSourceId}`
- `ecosystems/{ecosystemId}/lenses/{lensId}`
- `ecosystems/{ecosystemId}/recommendations/{recommendationId}`
- `ecosystems/{ecosystemId}/decisions/{decisionId}`

Callable function or HTTPS endpoint contract:

- `getEcosystemSnapshot`
- `processEvidence`
- `rankMentors`
- `rankPartners`
- `recordDecision`

`createFirebaseEcosystemDataGateway()` is intentionally transport-agnostic.
It can be backed later by Firebase callable functions, HTTPS Cloud Functions, or any Google-hosted API that returns the same payloads.
