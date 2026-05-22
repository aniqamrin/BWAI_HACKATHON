# AGENTS.md — BWAI Relationship OS

Project context for agentic coding tools (Codex.app, Codex CLI, etc.). Read this before starting any non-trivial change.

## Project

BWAI hackathon project. The current focus is **Relationship OS** — a mentor ↔ startup matching and evidence-tracking system. Demo audience: hackathon judges (X Combinator framing in the UI). Built to show ecosystem-level visibility into mentor-startup relationships using WhatsApp-derived evidence, lens views, and ranked recommendations.

## Stack

- **Backend:** Node + Express, Postgres. Entry: `backend/server.js`. SQL in `backend/src/db/schema.sql` and `backend/src/db/seed.sql`.
- **Frontend:** Vite + TypeScript + React. Entry: `frontend/src/main.tsx`. Key component: `frontend/src/components/EcosystemCommandCenter.tsx`.
- **Container:** `docker-compose.yml` (prod) + `docker-compose.dev.yml`. Local Postgres via Docker.
- **Demo scripts:** `backend/scripts/test-ecosystem-demo.js` and `test-ecosystem-live.js`.

Check `backend/package.json` and `frontend/package.json` for exact versions and npm scripts.

## Branches & remotes — READ BEFORE PUSHING

Two remotes exist, with different ownership:

| Remote | URL | Purpose | Push rules |
|---|---|---|---|
| `hackathon` | `aniqamrin/BWAI_HACKATHON` | Team remote (collaborator: aniqamrin) | Push to `codex/relationship-os-comparison` only. Do **NOT** push to `hackathon/main` — it's the live demo branch. |
| `origin` | `friedbeef1/BWAI` | Personal fork (jamesyeang) | Holds parallel UX/docs work on `experiment/ecosystem-relationships`. Do **NOT** push to `origin/main` without explicit approval. |

**This worktree tracks `hackathon/codex/relationship-os-comparison`.** Stay on it. New work goes here.

## What's already done (don't redo)

- Backend contract hardened (commit `5024ef8`)
- Relationship OS branded as "X Combinator" in the demo UI (`6adeb51`)
- Demo controls polished (`dd70172`)
- Recommendation copy scoped by company (`8738b58`, `c4ca0bc`)
- Mentor rankings lens (`b445904`)
- WhatsApp evidence ingestion frontend (`6401989`) — see `EcosystemCommandCenter.tsx`
- Lens maps + responsive spacing (`572834f`, `7833687`)
- Relationship OS mock + responsive layout polish (`91a79eb`, `f9d2918`, `08f6361`)

The parallel `experiment/ecosystem-relationships` branch on `origin` has docs-only work (project evaluation narrative, next-step workflow refactor). Not merged here. **Don't merge it unless the operator explicitly asks** — the two tracks are intentionally separate.

## What's next

> **OPERATOR: replace this block with the immediate next task before starting Codex.app.**
>
> Example shapes:
> - "Bug: clicking a mentor card in `EcosystemCommandCenter.tsx` resets the lens filter — fix and add a test."
> - "Feature: ingest `fixtures/relationship-os-whatsapp-sync.csv` into the backend so the frontend reads live data instead of the inline mock."
> - "Refactor: extract the lens-rendering logic from `EcosystemCommandCenter.tsx` into a hook."

## Reference data

`fixtures/relationship-os-whatsapp-sync.csv` — sample WhatsApp evidence rows used by the Relationship OS ingestion flow. Columns include `mentor_id`, `startup_id`, `hours_synced`, `milestones_completed`, `whatsapp_chat_excerpt`, `sentiment_warmth`, `mentor_responsiveness`, etc. Use as fixture for backend ingestion tests or as seed for demo data.

## Constraints — do not violate

- **No pushes to `hackathon/main` or `origin/main`.** Both are protected by hand, not by GitHub rules. Breaking this disrupts the live demo or the collaborator's work.
- **No force-pushes**, not even on `codex/relationship-os-comparison` — the collaborator may have local clones.
- **Don't delete or rewrite history on the `experiment/ecosystem-relationships` branch.** Different track, leave alone.
- **Don't touch `.env` or `backend/.env`.** Use `.env.example` as the canonical template; secrets stay out of the repo.
- **Run `npm install` per dir** (`backend/` and `frontend/` have separate `package.json`).

## How to verify a change before committing

1. Backend smoke: `cd backend && node scripts/test-ecosystem-demo.js` (offline) or `test-ecosystem-live.js` (needs DB).
2. Frontend smoke: `cd frontend && npm run dev` → open browser → exercise the Relationship OS view.
3. Tests: `cd frontend && npm test -- App.test.tsx` covers the WhatsApp ingestion mount path.
4. Git: `git status` clean before commit; commit message in conventional style (`feat:`, `fix:`, `refactor:`, `chore:`).

## When in doubt

Read the recent commit log (`git log --oneline -20`) — it's the most reliable record of what's recent and why.
