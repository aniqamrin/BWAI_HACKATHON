# Cohort Atlas Design Spec

Date: 2026-05-16
Status: Ready for user review
Project path: `/Users/jamesyeang/Downloads/BWAI`

## Product Intent

Cohort Atlas is a polished local hackathon prototype that demonstrates how monthly offline CSV records can become accelerator intelligence. The app should feel like a premium operating dashboard for a startup accelerator, not a raw admin panel.

The primary demo moment is a visible transformation: an at-risk mentor-startup graph becomes healthier after the user processes raw offline information. AI reasoning and cohort metrics reinforce the transformation, but the graph evolution is the headline.

## Build Scope

This pass targets a local working prototype only. It does not need live deployment, production authentication, or real Supabase/Gemini integration.

The app will be built as a fast polished prototype using Vite, React, Tailwind CSS, and React Flow. Supabase and Gemini will be represented by clean internal adapters so the code can later swap deterministic local behavior for live services.

## Experience Principles

- Frontend polish is the top priority across the whole app, not only access control.
- The app opens directly into the product. There is no login screen.
- Optimize for a large display or projector-style demo.
- The visual style is institutional, editorial, and operational.
- Use the product name `Cohort Atlas`.
- The primary import CTA is `Process Raw Information`.
- No CSS gradients anywhere in the app.
- Prefer self-contained assets after dependencies are installed. The app should not rely on web fonts, remote images, or network API calls during the demo.
- The interface copy should use concise executive operating-system language.

## Visual Direction

The selected direction is Institutional Ledger without gradients.

Use a calm, premium, material-inspired interface:

- Warm paper-like surfaces using flat colors.
- Ink, green, amber, and controlled red status accents.
- Strong typographic hierarchy with distinctive local fonts or bundled font assets.
- Thin borders, compact panels, crisp spacing, and measured motion.
- No generic white SaaS dashboard styling.
- No purple AI gradients, glow-heavy decoration, or stock startup visuals.

The UI should feel designed for accelerator leadership reviewing monthly cohort health.

## Primary App Structure

The app uses a hybrid dashboard structure:

- A single main dashboard screen.
- A prominent ingestion panel.
- A visible baseline graph on first load.
- Secondary detail/drawer states for reasoning and executive summary.

The first screen should show a split baseline:

- At-risk cohort graph visible immediately.
- Ingestion panel clearly prompting `Process Raw Information`.
- Supporting metrics that imply the ecosystem needs an update.

The app should not start empty. It should show enough baseline state to make the post-processing change obvious.

## Demo Flow

The demo flow should be fast and crisp, with a 90-second presentation rhythm but only 6-10 seconds of perceived app processing.

1. Baseline state:
   - Show the Cohort Atlas dashboard with a startup accelerator cohort.
   - Several mentor-startup relationships appear at risk.
   - Metrics indicate stale intelligence and relationship risk.

2. Ingestion:
   - User can drag and drop a CSV file.
   - User can also click a reliable sample CSV path for demo safety.
   - The primary CTA says `Process Raw Information`.

3. Processing:
   - Stepwise reveal checks off quickly:
     - Parse rows.
     - Evaluate fit.
     - Update graph.
     - Prepare executive summary.
   - The processing state should feel intelligent without feeling slow.

4. Evolution:
   - The graph updates using balanced motion.
   - Previously at-risk red edges/nodes shift toward healthy states.
   - Cohort health metrics update.
   - The executive insight drawer opens automatically.

5. Review:
   - The drawer leads with a cohort-level summary.
   - Relationship details appear below as a ranked list or compact cards.
   - Clicking graph nodes or edges can reveal detailed reasoning for that relationship.

## Data Model

Use a fictional startup accelerator cohort with realistic names.

CSV rows should include the PRD fields:

- `mentor_id`
- `startup_id`
- `hours_synced`
- `milestones_completed`
- `blockers_identified`
- `founder_confidence_score`
- `mentor_confidence_score`

The prototype should include 10-15 realistic rows. Blocker text should vary enough to make the simulated AI reasoning feel grounded.

Internal app data should also include display metadata:

- Mentor name, role, and domain.
- Startup name, category, stage, and founder.
- Current relationship health.
- Previous relationship health.
- AI rationale.
- Recommended next action.

## AI Evaluation Behavior

Default behavior is deterministic and local. There is no visible simulated/live toggle in the UI.

The code should expose an evaluation adapter boundary:

- `evaluateCohortSync(rows)` returns structured fit results.
- The default implementation maps known sample CSV input to reliable demo output.
- A later live Gemini adapter can replace or sit behind the same interface.

The simulated output should look like a Gemini-style synthesis, but avoid claiming a real API call occurred.

Expected result shape:

- `engagement_health`: integer score.
- `previous_health`: integer score.
- `health_delta`: integer change.
- `confidence`: integer or percentage.
- `reasoning`: short executive explanation.
- `signals`: positive and negative evidence from the CSV.
- `recommended_action`: concrete program-manager next step.

## Persistence

The app should persist transformed demo state locally so refreshes can preserve the completed graph.

It must also include a clear reset control so the presenter can return to the baseline state quickly.

The reset control should be visible but not visually dominant.

## CSV Upload Requirements

The prototype should support both:

- Drag-and-drop CSV upload.
- One-click sample data ingest.

CSV parsing should validate the expected headers and show a polished error state if the file is invalid.

For the hackathon demo, the sample ingest path should be the reliable happy path.

## Graph Requirements

Use React Flow for the graph.

The graph should be balanced between credible and theatrical:

- Clear mentor/startup labels.
- Health status encoded by color and edge weight.
- Enough motion to make transformation visible.
- Not so much motion that the graph becomes hard to read.

Baseline graph:

- Several relationships are red or amber.
- The stale-data risk should be visible.

Post-ingestion graph:

- Improved relationships visibly become healthier.
- At least one relationship should remain amber or flagged to preserve credibility.
- Clicking a node or edge opens a detail state with reasoning.

## Components

Suggested component boundaries:

- `AppShell`: top-level layout, name, status, reset control.
- `DashboardHeader`: product identity, cohort period, high-level status.
- `CohortMetrics`: health score, at-risk count, updated relationships, confidence.
- `IngestionPanel`: drag-and-drop, sample ingest, CSV status.
- `ProcessingTimeline`: parse/evaluate/update/summary progress.
- `CohortGraph`: React Flow visualization.
- `InsightDrawer`: cohort-level summary and relationship details.
- `RelationshipCard`: changed relationship summary.
- `StatusLegend`: health color definitions.

These boundaries should keep the code understandable and avoid a single oversized dashboard file.

## Error Handling

Handle at least these states:

- Invalid CSV type.
- Missing required headers.
- Empty CSV.
- Parse failure.
- Reset to baseline.

Error copy should stay executive and concise. Avoid technical stack traces in the UI.

## Testing And Verification

Before showing the app as ready:

- Run the build or typecheck available for the chosen stack.
- Open the local app in the browser.
- Visually verify the large-display layout.
- Confirm the first screen shows baseline graph and ingestion prompt.
- Run the sample ingest flow.
- Confirm the staged processing completes quickly.
- Confirm the graph transforms.
- Confirm the insight drawer opens with cohort-level summary first.
- Confirm reset returns to baseline.
- Confirm no obvious overflow, overlapping text, broken labels, or gradient usage.

## Out Of Scope

- Real authentication.
- Live Supabase setup.
- Live Gemini API calls.
- Production deployment.
- Multi-tenant data isolation.
- Full admin CRUD.
- Mobile-first optimization.
- CSV ingestion history across multiple months.

## Open Implementation Notes

- Because the project folder is currently empty and not a git repository, scaffolding will happen after this spec is approved.
- If live integration is added later, the adapter boundary should be implemented without changing the UI flow.
- The local sample CSV should ship with the repo so the demo can run without network access after dependencies are installed.
