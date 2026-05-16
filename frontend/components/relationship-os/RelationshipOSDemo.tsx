"use client";

import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Database,
  FileText,
  GitBranch,
  Globe2,
  Handshake,
  Link2,
  MessageCircle,
  Search,
  ShieldCheck,
  Trophy,
  Upload,
  UserCheck,
  Users2,
} from "lucide-react";
import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  relationshipOsFirebaseContract,
  relationshipOsSnapshot,
  type Action,
  type ActionStatus,
  type EvidenceSource,
  type LensId,
  type MentorRanking,
  type Relationship,
  type Signal,
} from "@/lib/relationship-os-data";

type Icon = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
type Decision = "approved" | "needs_evidence";

const SAMPLE_WHATSAPP_CSV_PATH = "/demo/relationship-os-whatsapp-sync.csv";
const LIVE_EVIDENCE_SOURCE_IDS = ["whatsapp-export", "csv-may-sync"];

type CsvEvidenceState = {
  kind: "csv" | "text";
  filename: string;
  sourceLabel: string;
  rowLabel: string;
  rowCount: number;
  mentorCount: number;
  startupCount: number;
  participantCount: number;
  blockerCount: number;
  rows: Record<string, string>[];
  preview: string[];
};

type ProcessedCsvSummary = {
  rowLabel: string;
  rowCount: number;
  relationshipLabel: string;
  relationshipDetail: string;
  relationshipCount: number;
  blockerCount: number;
  unresolvedAskCount: number;
  partnerSignalCount: number;
  confidenceValue: string;
  confidenceDetail: string;
  topActorLabel: string;
  topMentorName: string;
  topMentorScore: number;
};

const sourceIcons: Record<string, Icon> = {
  "whatsapp-export": MessageCircle,
  "csv-may-sync": Database,
  "deck-atlas": FileText,
  "deck-nora": FileText,
  "partner-notes": Link2,
};

const lensIcons: Record<LensId, Icon> = {
  relationships: GitBranch,
  "mentor-ranking": Trophy,
  "partner-intros": Handshake,
  evidence: Database,
};

const statusClasses: Record<ActionStatus | "Approved" | "Evidence requested", string> = {
  "Auto-ready": "border-[#45624f] bg-[#dce6d8] text-[#263b2d]",
  "Review suggested": "border-[#ad8448] bg-[#f0dfbf] text-[#6b4a1c]",
  "Manual evidence needed": "border-[#934439] bg-[#f4d8ce] text-[#743025]",
  Approved: "border-[#45624f] bg-[#17211c] text-[#fffaf0]",
  "Evidence requested": "border-[#934439] bg-[#fffaf0] text-[#743025]",
};

const primaryActionsByLens: Record<LensId, string> = {
  relationships: "action-atlas-priya",
  "mentor-ranking": "action-rank-priya",
  "partner-intros": "action-greenbridge-carbonloop",
  evidence: "action-greenbridge-carbonloop",
};

const startupBriefs = {
  "startup-atlas-ai": {
    label: "Atlas AI",
    stage: "Seed",
    need: "Procurement risk is slowing enterprise pilots.",
    mentor: "Priya Raman",
    partner: "No partner intro yet",
  },
  "startup-carbonloop": {
    label: "CarbonLoop",
    stage: "Pre-seed",
    need: "Grant deadline needs climate finance proof.",
    mentor: "Farah Lim",
    partner: "GreenBridge Labs",
  },
  "startup-nora-health": {
    label: "Nora Health",
    stage: "Seed",
    need: "Clinical language needs compliance review.",
    mentor: "Alicia Mensah",
    partner: "Hold partner intros",
  },
} satisfies Record<string, { label: string; stage: string; need: string; mentor: string; partner: string }>;

const startupIds = ["startup-atlas-ai", "startup-carbonloop", "startup-nora-health"];

function parseCsvRows(csvText: string) {
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const next = csvText[index + 1];

    if (char === '"' && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);

  const [headers = [], ...records] = rows;

  return records.map((record) =>
    headers.reduce<Record<string, string>>((parsed, header, headerIndex) => {
      parsed[header] = record[headerIndex] ?? "";
      return parsed;
    }, {}),
  );
}

function summarizeCsvEvidence(filename: string, csvText: string): CsvEvidenceState {
  const rows = parseCsvRows(csvText);
  const mentors = new Set(rows.map((row) => row.mentor_id).filter(Boolean));
  const startups = new Set(rows.map((row) => row.startup_id).filter(Boolean));
  const blockers = rows.filter((row) => row.blockers_identified?.trim()).length;

  return {
    kind: "csv",
    filename,
    sourceLabel: "CSV",
    rowLabel: "CSV rows",
    rowCount: rows.length,
    mentorCount: mentors.size,
    startupCount: startups.size,
    participantCount: mentors.size + startups.size,
    blockerCount: blockers,
    rows,
    preview: rows.slice(0, 3).map((row) => `${row.mentor_name} to ${row.startup_name}: ${row.blockers_identified}`),
  };
}

function normalizeParticipantId(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function summarizeTextEvidence(filename: string, text: string): CsvEvidenceState {
  const lines = text
    .split(/\r?\n|\s\|\s/g)
    .map((line) => line.trim())
    .filter(Boolean);
  const rows = lines.map((line, index) => {
    const whatsappMatch = line.match(/^\[?[0-9/.,:\sAPMapm-]+\]?\s*([^:]{2,60}):\s*(.+)$/);
    const simpleSpeakerMatch = line.match(/^([^:]{2,60}):\s*(.+)$/);
    const speaker = (whatsappMatch?.[1] ?? simpleSpeakerMatch?.[1] ?? `Evidence line ${index + 1}`).trim();
    const message = (whatsappMatch?.[2] ?? simpleSpeakerMatch?.[2] ?? line).trim();
    const lowerMessage = message.toLowerCase();

    return {
      mentor_id: `participant-${normalizeParticipantId(speaker) || index}`,
      startup_id: "uploaded-text-evidence",
      mentor_name: speaker,
      startup_name: "Uploaded evidence",
      hours_synced: "0",
      milestones_completed: /(done|completed|drafted|sent|shared|finished|mapped|reviewed)/i.test(message) ? message : "",
      blockers_identified: /(blocker|blocked|stuck|delay|risk|issue|concern|cannot|can't|waiting|unsure|not ready)/i.test(message)
        ? message
        : "",
      founder_confidence_score: "",
      mentor_confidence_score: "",
      whatsapp_chat_excerpt: message,
      follow_ups: /(follow up|next step|send|share|intro|introduce|circle back|schedule|book|review)/i.test(message) ? message : "",
      unresolved_asks: /\?|can you|could you|please|waiting for|need you to/i.test(message) ? message : "",
      sentiment_warmth: /(thanks|thank you|great|helpful|excited|appreciate|good progress)/i.test(message)
        ? "high"
        : /(ok|agree|promising|close|clear)/i.test(lowerMessage)
          ? "medium"
          : "neutral",
      mentor_responsiveness: "uploaded text",
    };
  });
  const participants = new Set(rows.map((row) => row.mentor_name).filter(Boolean));

  return {
    kind: "text",
    filename,
    sourceLabel: "WhatsApp/TXT",
    rowLabel: "messages",
    rowCount: rows.length,
    mentorCount: participants.size,
    startupCount: 0,
    participantCount: participants.size,
    blockerCount: rows.filter((row) => row.blockers_identified).length,
    rows,
    preview: rows.slice(0, 3).map((row) => `${row.mentor_name}: ${row.whatsapp_chat_excerpt}`),
  };
}

function processCsvEvidenceRows(csv: CsvEvidenceState): ProcessedCsvSummary {
  const relationshipPairs = new Set(csv.rows.filter((row) => row.mentor_id && row.startup_id).map((row) => `${row.mentor_id}:${row.startup_id}`));
  const participants = new Set(csv.rows.map((row) => row.mentor_name).filter(Boolean));
  const confidenceScores = csv.rows
    .flatMap((row) => [Number(row.founder_confidence_score), Number(row.mentor_confidence_score)])
    .filter((score) => Number.isFinite(score));
  const mentorScores = new Map<string, { name: string; total: number; count: number }>();

  csv.rows.forEach((row) => {
    const mentorId = row.mentor_id;
    if (!mentorId) return;

    const founderConfidence = Number(row.founder_confidence_score) || 0;
    const mentorConfidence = Number(row.mentor_confidence_score) || 0;
    const hoursSynced = Number(row.hours_synced) || 0;
    const warmthScore = row.sentiment_warmth === "high" ? 6 : row.sentiment_warmth === "medium" ? 3 : 0;
    const responsivenessScore = /(4 hours|same day)/i.test(row.mentor_responsiveness)
      ? 6
      : /(24 hours|1 day)/i.test(row.mentor_responsiveness)
        ? 3
        : 0;
    const rowScore = ((founderConfidence + mentorConfidence) / 2) * 10 + Math.min(hoursSynced * 3, 16) + warmthScore + responsivenessScore;
    const current = mentorScores.get(mentorId) ?? { name: row.mentor_name || mentorId, total: 0, count: 0 };

    mentorScores.set(mentorId, {
      ...current,
      total: current.total + rowScore,
      count: current.count + 1,
    });
  });

  const rankedMentor = Array.from(mentorScores.values())
    .map((mentor) => ({
      name: mentor.name,
      score: Math.min(100, Math.round(mentor.total / Math.max(mentor.count, 1))),
    }))
    .sort((first, second) => second.score - first.score)[0];
  const warmMessages = csv.rows.filter((row) => row.sentiment_warmth === "high" || row.sentiment_warmth === "medium").length;
  const averageConfidence = confidenceScores.length
    ? Math.round((confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length) * 10) / 10
    : 0;

  return {
    rowLabel: csv.rowLabel,
    rowCount: csv.rowCount,
    relationshipLabel: csv.kind === "text" ? "Participants" : "Relationships",
    relationshipDetail: csv.kind === "text" ? "speakers parsed" : "mentor-startup pairs",
    relationshipCount: csv.kind === "text" ? participants.size : relationshipPairs.size,
    blockerCount: csv.blockerCount,
    unresolvedAskCount: csv.rows.filter((row) => row.unresolved_asks?.trim()).length,
    partnerSignalCount: csv.rows.filter((row) => /partner|intro|grant|pilot|greenbridge/i.test(`${row.follow_ups} ${row.unresolved_asks} ${row.blockers_identified}`)).length,
    confidenceValue: csv.kind === "text" ? `${warmMessages}` : `${averageConfidence}/10`,
    confidenceDetail: csv.kind === "text" ? "warmth cues found" : "founder and mentor scores",
    topActorLabel: csv.kind === "text" ? "Most active" : "Top mentor",
    topMentorName: rankedMentor?.name ?? "No participants",
    topMentorScore: rankedMentor?.score ?? 0,
  };
}

function getActorById(id: string) {
  const actor = relationshipOsSnapshot.actors.find((candidate) => candidate.id === id);

  if (!actor) {
    throw new Error(`Missing actor ${id}`);
  }

  return actor;
}

function getRelationshipById(id: string | undefined) {
  if (!id) return null;
  return relationshipOsSnapshot.relationships.find((relationship) => relationship.id === id) ?? null;
}

function getDefaultActionForContext(lensId: LensId, startupId: string) {
  const startupActions = relationshipOsSnapshot.actions.filter((action) => action.actorIds.includes(startupId));
  const primaryAction = relationshipOsSnapshot.actions.find((action) => action.id === primaryActionsByLens[lensId] && action.actorIds.includes(startupId));
  const directAction = startupActions.find((action) => action.lensId === lensId);

  return primaryAction ?? directAction ?? startupActions[0] ?? relationshipOsSnapshot.actions[0];
}

function StatusPill({ status }: { status: ActionStatus | "Approved" | "Evidence requested" }) {
  return (
    <span className={cn("inline-flex items-center border px-2 py-1 text-[0.64rem] font-bold uppercase tracking-[0.1em]", statusClasses[status])}>
      {status}
    </span>
  );
}

function CompactMetricButton({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 border border-[#9d8f77] bg-[#f7f1e5] px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#59675e] hover:bg-[#fbf4e7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#17211c]"
      onClick={onClick}
    >
      <span className="text-[#17211c]">{value}</span>
      {label}
    </button>
  );
}

function ActionCallout({
  label,
  title,
  detail,
  tone = "insight",
}: {
  label: string;
  title: string;
  detail: string;
  tone?: "decision" | "recommendation" | "insight";
}) {
  const toneClass =
    tone === "decision"
      ? "border-[#45624f] bg-[#dce6d8]"
      : tone === "recommendation"
        ? "border-[#ad8448] bg-[#f0dfbf]"
        : "border-[#9d8f77] bg-[#fbf4e7]";

  return (
    <div className={cn("border px-4 py-4", toneClass)}>
      <p className="text-[0.64rem] font-bold uppercase tracking-[0.14em] text-[#59675e]">{label}</p>
      <h3 className="mt-2 text-lg font-semibold leading-tight text-[#17211c]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#405047]">{detail}</p>
    </div>
  );
}

function SourceBadge({ source }: { source: EvidenceSource }) {
  const IconComponent = sourceIcons[source.id] ?? FileText;

  return (
    <article
      className={cn(
        "min-w-0 border border-[#9d8f77] px-4 py-4",
        source.primary ? "bg-[#17211c] text-[#fffaf0]" : "bg-[#fffaf0] text-[#17211c]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center border", source.primary ? "border-[#fffaf0]" : "border-[#17211c]")}>
          <IconComponent className="h-4 w-4" aria-hidden />
        </div>
        <span className={cn("border px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em]", source.primary ? "border-[#d9cfbd]" : "border-[#9d8f77] text-[#657064]")}>
          {source.label}
        </span>
      </div>
      <h3 className="mt-4 text-sm font-bold">{source.title}</h3>
      <p className={cn("mt-2 text-xs leading-5", source.primary ? "text-[#e5decd]" : "text-[#405047]")}>{source.detail}</p>
      <p className={cn("mt-4 w-fit border px-2 py-1 text-[0.64rem] font-bold uppercase tracking-[0.08em]", source.primary ? "border-[#d9cfbd]" : "border-[#9d8f77] text-[#59675e]")}>
        {source.state}
      </p>
    </article>
  );
}

function SignalRow({ signal }: { signal: Signal }) {
  const source = relationshipOsSnapshot.evidenceSources.find((candidate) => candidate.id === signal.sourceId);
  const IconComponent = sourceIcons[signal.sourceId] ?? Activity;

  return (
    <div className="grid grid-cols-[34px_minmax(0,1fr)_auto] gap-3 border-b border-[#cab99d] px-4 py-3 last:border-b-0">
      <div className="flex h-8 w-8 items-center justify-center border border-[#17211c] bg-[#fffaf0]">
        <IconComponent className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-[#17211c]">{signal.label}</p>
        <p className="mt-1 text-xs leading-5 text-[#59675e]">{signal.detail}</p>
      </div>
      <div className="self-start text-right">
        <p className="border border-[#9d8f77] bg-[#fbf4e7] px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#59675e]">
          {signal.state}
        </p>
        <p className="mt-1 text-[0.62rem] text-[#6c715f]">{source?.label}</p>
      </div>
    </div>
  );
}

function LensBar({
  activeLens,
  onSelectLens,
}: {
  activeLens: LensId;
  onSelectLens: (lensId: LensId) => void;
}) {
  const tabCopy: Record<LensId, { title: string; detail: string; metric: string }> = {
    relationships: {
      title: "Decision",
      detail: "What to do next",
      metric: `${relationshipOsSnapshot.actions.filter((action) => action.lensId === "relationships").length} queued`,
    },
    "mentor-ranking": {
      title: "Mentors",
      detail: "Who to deploy first",
      metric: `${relationshipOsSnapshot.mentorRankings.length} ranked`,
    },
    "partner-intros": {
      title: "Partners",
      detail: "Warm paths worth taking",
      metric: `${relationshipOsSnapshot.actions.filter((action) => action.lensId === "partner-intros").length} intro`,
    },
    evidence: {
      title: "Evidence",
      detail: "Why the model believes it",
      metric: `${relationshipOsSnapshot.signals.length} signals`,
    },
  };

  return (
    <nav aria-label="Relationship OS views" className="border border-[#17211c] bg-[#17211c] p-2">
      <div className="grid grid-cols-4 gap-2">
      {relationshipOsSnapshot.lenses.map((lens) => {
        const IconComponent = lensIcons[lens.id];
        const isActive = activeLens === lens.id;
        const copy = tabCopy[lens.id];

        return (
          <button
            key={lens.id}
            type="button"
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-h-[58px] flex-col items-start justify-center gap-1 border px-2 py-2 text-left transition-colors sm:grid sm:min-h-[72px] sm:grid-cols-[20px_minmax(0,1fr)_auto] sm:items-center sm:gap-3 sm:px-3 sm:py-3",
              isActive ? "border-[#fffaf0] bg-[#fffaf0] text-[#17211c]" : "border-[#4d594f] bg-[#17211c] text-[#e5decd] hover:bg-[#24332b]",
            )}
            onClick={() => onSelectLens(lens.id)}
          >
            <IconComponent className="h-4 w-4" aria-hidden />
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-tight sm:text-base">{copy.title}</span>
              <span className={cn("mt-1 hidden text-xs leading-5 sm:block", isActive ? "text-[#405047]" : "text-[#d9cfbd]")}>{copy.detail}</span>
            </span>
            <span className={cn("hidden w-fit border px-2 py-1 text-[0.58rem] font-bold uppercase tracking-[0.1em] sm:block", isActive ? "border-[#9d8f77] text-[#59675e]" : "border-[#4d594f] text-[#c7bba9]")}>
              {copy.metric}
            </span>
          </button>
        );
      })}
      </div>
    </nav>
  );
}

function StartupSelector({
  selectedStartupId,
  onSelectStartup,
}: {
  selectedStartupId: string;
  onSelectStartup: (startupId: string) => void;
}) {
  const selectedStartup = startupBriefs[selectedStartupId];

  return (
    <section id="relationship-os-company-picker" className="border border-[#17211c] bg-[#fffaf0]">
      <div className="flex flex-col gap-1 border-b border-[#9d8f77] bg-[#f7f1e5] px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Company first</p>
          <h2 className="mt-1 text-xl font-semibold leading-tight text-[#17211c]">Showing recommendations for {selectedStartup.label}</h2>
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#59675e]">{selectedStartup.need}</p>
      </div>

      <div className="grid gap-2 p-2 md:grid-cols-3">
        {startupIds.map((startupId) => {
          const startup = startupBriefs[startupId];
          const isSelected = selectedStartupId === startupId;

          return (
            <button
              key={startupId}
              type="button"
              className={cn(
                "grid gap-2 border px-3 py-3 text-left transition-colors",
                isSelected ? "border-[#17211c] bg-[#17211c] text-[#fffaf0]" : "border-[#cab99d] bg-[#fffaf0] text-[#17211c] hover:bg-[#fbf4e7]",
              )}
              onClick={() => onSelectStartup(startupId)}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-base font-semibold leading-tight">{startup.label}</span>
                <span className={cn("border px-2 py-1 text-[0.58rem] font-bold uppercase tracking-[0.1em]", isSelected ? "border-[#d9cfbd] text-[#d9cfbd]" : "border-[#9d8f77] text-[#59675e]")}>
                  {startup.stage}
                </span>
              </span>
              <span className={cn("text-xs leading-5", isSelected ? "text-[#e5decd]" : "text-[#405047]")}>{startup.need}</span>
              <span className={cn("text-[0.62rem] font-bold uppercase tracking-[0.1em]", isSelected ? "text-[#d9cfbd]" : "text-[#59675e]")}>
                Mentor fit: {startup.mentor}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ActionQueue({
  actions,
  activeActionId,
  decisions,
  onSelectAction,
}: {
  actions: Action[];
  activeActionId: string;
  decisions: Record<string, Decision>;
  onSelectAction: (actionId: string) => void;
}) {
  const activeAction = actions.find((action) => action.id === activeActionId) ?? actions[0];
  const activeDecision = activeAction ? decisions[activeAction.id] : undefined;
  const decisionTitle =
    activeDecision === "approved"
      ? "Approved in this demo"
      : activeDecision === "needs_evidence"
        ? "Evidence requested before approval"
        : activeAction?.status === "Manual evidence needed"
          ? "Request one more proof point before approval"
          : `Approve: ${activeAction?.title ?? "Select the next action"}`;

  return (
    <section id="relationship-os-actions" tabIndex={-1} className="scroll-mt-4 border border-[#17211c] bg-[#fffaf0] focus:outline-none">
      <div className="flex items-end justify-between gap-4 border-b border-[#9d8f77] bg-[#f7f1e5] px-4 py-4">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Next steps</p>
          <h2 className="mt-1 text-2xl font-semibold leading-tight">Current decision queue</h2>
        </div>
        <p className="text-right text-xs font-bold uppercase tracking-[0.1em] text-[#59675e]">{actions.length} actions</p>
      </div>

      {activeAction ? (
        <div className="border-b border-[#cab99d] px-4 py-4">
          <ActionCallout label="Decision" title={decisionTitle} detail={activeAction.summary} tone="decision" />
        </div>
      ) : null}

      <div className="divide-y divide-[#cab99d]">
        {actions.map((action) => {
          const isActive = activeActionId === action.id;
          const decision = decisions[action.id];
          const visibleStatus = decision === "approved" ? "Approved" : decision === "needs_evidence" ? "Evidence requested" : action.status;

          return (
            <button
              key={action.id}
              type="button"
              className={cn(
                "grid w-full gap-3 px-4 py-4 text-left transition-colors md:grid-cols-[minmax(0,1fr)_auto]",
                isActive ? "bg-[#dce6d8]" : "bg-[#fffaf0] hover:bg-[#f7f1e5]",
              )}
              onClick={() => onSelectAction(action.id)}
            >
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <StatusPill status={visibleStatus} />
                  <span className="text-[0.64rem] font-bold uppercase tracking-[0.1em] text-[#59675e]">{action.confidence}% confidence</span>
                </span>
                <span className="mt-3 block text-base font-semibold leading-tight text-[#17211c]">{action.title}</span>
                <span className="mt-2 block text-sm leading-6 text-[#405047]">{action.summary}</span>
              </span>
              <span className="flex items-center justify-end text-[#405047]">
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SelectedInsightPanel({
  selectedAction,
  selectedRelationship,
  decisions,
  onRecordDecision,
}: {
  selectedAction: Action;
  selectedRelationship: Relationship | null;
  decisions: Record<string, Decision>;
  onRecordDecision: (actionId: string, decision: Decision) => void;
}) {
  const selectedActors = selectedAction.actorIds.map(getActorById);
  const selectedSignals = selectedAction.signals
    .map((signalId) => relationshipOsSnapshot.signals.find((signal) => signal.id === signalId))
    .filter((signal): signal is Signal => Boolean(signal));
  const decision = decisions[selectedAction.id];

  return (
    <section className="border border-[#17211c] bg-[#fffaf0]">
      <div className="border-b border-[#9d8f77] bg-[#f7f1e5] px-4 py-4">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Gemini reasoning</p>
        <h2 className="mt-1 text-2xl font-semibold leading-tight">{selectedAction.title}</h2>
      </div>

      <div className="space-y-5 px-4 py-5">
        <div className="flex flex-wrap gap-2">
          {selectedActors.map((actor) => (
            <span key={actor.id} className="border border-[#9d8f77] bg-[#fbf4e7] px-2 py-1 text-xs font-bold uppercase tracking-[0.08em] text-[#405047]">
              {actor.name}
            </span>
          ))}
        </div>

        <p className="text-base leading-7 text-[#263b2d]">{selectedAction.aiReasoning}</p>

        {selectedRelationship ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Health" value={`${selectedRelationship.health}`} detail={`${selectedRelationship.baselineHealth} baseline`} />
            <Metric label="Hours synced" value={`${selectedRelationship.hoursSynced}`} detail="last 30 days" />
            <Metric label="Confidence" value={`${selectedRelationship.founderConfidence}/${selectedRelationship.mentorConfidence}`} detail="founder / mentor" />
          </div>
        ) : null}

        {selectedRelationship ? (
          <div className="border border-[#cab99d] bg-[#fbf4e7] px-4 py-4">
            <p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#657064]">Blocker text</p>
            <p className="mt-2 text-sm leading-6 text-[#405047]">{selectedRelationship.blockersIdentified}</p>
            <p className="mt-4 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#657064]">Next step</p>
            <p className="mt-2 text-sm leading-6 text-[#17211c]">{selectedRelationship.nextStep}</p>
          </div>
        ) : null}

        <div className="border border-[#cab99d]">
          {selectedSignals.map((signal) => (
            <SignalRow key={signal.id} signal={signal} />
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className={cn(
              "flex min-h-11 flex-1 items-center justify-center gap-2 border border-[#17211c] px-4 py-2 text-sm font-bold",
              decision === "approved" ? "bg-[#17211c] text-[#fffaf0]" : "bg-[#fffaf0] text-[#17211c] hover:bg-[#17211c] hover:text-[#fffaf0]",
            )}
            onClick={() => onRecordDecision(selectedAction.id, "approved")}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Approve next step
          </button>
          <button
            type="button"
            className={cn(
              "flex min-h-11 flex-1 items-center justify-center gap-2 border border-[#17211c] px-4 py-2 text-sm font-bold",
              decision === "needs_evidence" ? "bg-[#934439] text-[#fffaf0]" : "bg-[#fffaf0] text-[#17211c] hover:bg-[#f4d8ce]",
            )}
            onClick={() => onRecordDecision(selectedAction.id, "needs_evidence")}
          >
            <Search className="h-4 w-4" aria-hidden />
            Request evidence
          </button>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="border border-[#cab99d] bg-[#fbf4e7] px-4 py-3">
      <p className="text-[0.64rem] font-bold uppercase tracking-[0.12em] text-[#657064]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[#17211c]">{value}</p>
      <p className="mt-1 text-xs text-[#59675e]">{detail}</p>
    </div>
  );
}

type RecommendationCopy = {
  contextLabel: string;
  eyebrow: string;
  title: string;
  summary: string;
  status: ActionStatus | "Approved" | "Evidence requested";
  confidence: number;
  reasons: string[];
  primaryLabel: string;
  primaryDecision: Decision;
  detailLabel: string;
};

function getRecommendationCopy(activeLens: LensId, action: Action, selectedStartupId: string): RecommendationCopy {
  if (selectedStartupId === "startup-carbonloop") {
    if (activeLens === "mentor-ranking") {
      return {
        contextLabel: "For CarbonLoop",
        eyebrow: "Mentor fit",
        title: "Deploy Farah for the climate finance sprint",
        summary: "CarbonLoop needs grant framing and finance proof before the June deadline.",
        status: action.status,
        confidence: action.confidence,
        reasons: ["The blocker is finance-specific.", "Farah matches climate grants and capital readiness.", "GreenBridge can validate the pilot once economics are ready."],
        primaryLabel: "Assign Farah",
        primaryDecision: "approved",
        detailLabel: "Show ranking details",
      };
    }

    if (activeLens === "partner-intros") {
      return {
        contextLabel: "For CarbonLoop",
        eyebrow: "Partner intro",
        title: "Hold GreenBridge until one proof point is ready",
        summary: "The partner is a fit, but the intro should wait until warehouse pilot economics are clear.",
        status: action.status,
        confidence: action.confidence,
        reasons: ["GreenBridge fits the circular logistics pilot.", "Grant timing makes the intro useful.", "Pilot economics are still missing."],
        primaryLabel: "Request pilot economics",
        primaryDecision: "needs_evidence",
        detailLabel: "Show partner rationale",
      };
    }

    if (activeLens === "evidence") {
      return {
        contextLabel: "For CarbonLoop",
        eyebrow: "Evidence readout",
        title: "Evidence supports mentor action, not partner approval yet",
        summary: "The CSV shows urgency and finance need; partner evidence still needs one stronger proof point.",
        status: "Review suggested",
        confidence: 82,
        reasons: ["CSV sync confirms the grant deadline.", "Blocker text points to finance readiness.", "Partner intro needs warehouse pilot economics."],
        primaryLabel: "Review missing evidence",
        primaryDecision: "needs_evidence",
        detailLabel: "Show evidence",
      };
    }

    return {
      contextLabel: "For CarbonLoop",
      eyebrow: "Recommended next step",
      title: "Move CarbonLoop into climate finance sprint",
      summary: "The right move is to pair CarbonLoop with Farah and use GreenBridge only after the pilot proof is ready.",
      status: action.status,
      confidence: action.confidence,
      reasons: ["The company has a near-term grant deadline.", "The blocker is specific enough to act on.", "Farah is the strongest mentor match."],
      primaryLabel: "Approve finance sprint",
      primaryDecision: "approved",
      detailLabel: "Show why",
    };
  }

  if (selectedStartupId === "startup-nora-health") {
    if (activeLens === "mentor-ranking") {
      return {
        contextLabel: "For Nora Health",
        eyebrow: "Mentor fit",
        title: "Use Alicia for review, not a broad intro",
        summary: "Nora needs clinical compliance judgment before the programme sends new hospital introductions.",
        status: action.status,
        confidence: action.confidence,
        reasons: ["The blocker is compliance language.", "Alicia is the best clinical product advisor.", "The next move should stay human-reviewed."],
        primaryLabel: "Assign Alicia review",
        primaryDecision: "approved",
        detailLabel: "Show ranking details",
      };
    }

    if (activeLens === "partner-intros") {
      return {
        contextLabel: "For Nora Health",
        eyebrow: "Partner intro",
        title: "Do not send hospital intros yet",
        summary: "The fit may be strong later, but the current evidence says the language needs review first.",
        status: "Manual evidence needed",
        confidence: 70,
        reasons: ["Clinical claims sound too absolute.", "Alicia should review the one-pager first.", "A premature intro creates governance risk."],
        primaryLabel: "Request review first",
        primaryDecision: "needs_evidence",
        detailLabel: "Show rationale",
      };
    }

    if (activeLens === "evidence") {
      return {
        contextLabel: "For Nora Health",
        eyebrow: "Evidence readout",
        title: "Evidence supports a review before introductions",
        summary: "The model is not saying Nora lacks fit; it is saying the next action should reduce compliance risk.",
        status: "Review suggested",
        confidence: 76,
        reasons: ["WhatsApp/TXT evidence flags clinical language risk.", "The founder has hospital interest.", "The missing step is advisor review."],
        primaryLabel: "Request advisor review",
        primaryDecision: "needs_evidence",
        detailLabel: "Show evidence",
      };
    }

    return {
      contextLabel: "For Nora Health",
      eyebrow: "Recommended next step",
      title: "Review clinical language before intros",
      summary: "The safest useful action is to have Alicia review Nora's one-pager before any hospital intro goes out.",
      status: action.status,
      confidence: action.confidence,
      reasons: ["Nora has real buyer interest.", "Compliance language is the active blocker.", "Alicia is the correct expert for the risk."],
      primaryLabel: "Approve review",
      primaryDecision: "approved",
      detailLabel: "Show why",
    };
  }

  if (activeLens === "mentor-ranking") {
    return {
      contextLabel: "For Atlas AI",
      eyebrow: "Mentor fit",
      title: "Deploy Priya first",
      summary: "Priya is the clearest mentor to activate because the need, fit, and timing all line up.",
      status: action.status,
      confidence: action.confidence,
      reasons: ["Atlas has a concrete procurement blocker.", "Priya has the strongest enterprise GTM fit.", "Both sides show high confidence."],
      primaryLabel: "Assign mentor",
      primaryDecision: "approved",
      detailLabel: "Show ranking details",
    };
  }

  if (activeLens === "partner-intros") {
    return {
      contextLabel: "For Atlas AI",
      eyebrow: "Partner intro",
      title: "No partner intro yet",
      summary: "Atlas needs mentor help on procurement before the programme creates external partner motion.",
      status: "Manual evidence needed",
      confidence: 67,
      reasons: ["The active blocker is buyer risk, not partner access.", "Priya should sharpen the security narrative first.", "A partner intro would be premature."],
      primaryLabel: "Hold partner intro",
      primaryDecision: "needs_evidence",
      detailLabel: "Show partner rationale",
    };
  }

  if (activeLens === "evidence") {
    return {
      contextLabel: "For Atlas AI",
      eyebrow: "Evidence readout",
      title: "Evidence supports a Priya follow-up",
      summary: "The evidence points to one clear action: help Atlas explain procurement and deployment risk.",
      status: action.status,
      confidence: action.confidence,
      reasons: ["WhatsApp/TXT evidence repeats procurement delay.", "CSV confidence scores are high.", "The blocker maps directly to Priya's expertise."],
      primaryLabel: "Approve mentor follow-up",
      primaryDecision: "approved",
      detailLabel: "Show evidence",
    };
  }

  return {
    contextLabel: "For Atlas AI",
    eyebrow: "Recommended next step",
    title: "Create Priya to Atlas follow-up",
    summary: "This is the cleanest next move: the problem is specific, the mentor fit is strong, and the confidence is high.",
    status: action.status,
    confidence: action.confidence,
    reasons: ["Atlas is stuck on procurement risk.", "Priya can help with enterprise buyer mapping.", "Founder and mentor confidence are both high."],
    primaryLabel: "Approve next step",
    primaryDecision: "approved",
    detailLabel: "Show why",
  };
}

function PrimaryRecommendationCard({
  recommendation,
  decision,
  onPrimaryAction,
  onShowDetails,
}: {
  recommendation: RecommendationCopy;
  decision: Decision | undefined;
  onPrimaryAction: () => void;
  onShowDetails: () => void;
}) {
  const visibleStatus = decision === "approved" ? "Approved" : decision === "needs_evidence" ? "Evidence requested" : recommendation.status;

  return (
    <section className="border border-[#17211c] bg-[#fffaf0]">
      <div className="grid gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={visibleStatus} />
            <span className="border border-[#9d8f77] bg-[#fbf4e7] px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#59675e]">
              {recommendation.confidence}% confidence
            </span>
          </div>
          <p className="mt-4 w-fit border border-[#9d8f77] bg-[#f7f1e5] px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#59675e]">
            {recommendation.contextLabel}
          </p>
          <p className="mt-5 text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#657064]">{recommendation.eyebrow}</p>
          <h2 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight text-[#17211c] md:text-4xl">{recommendation.title}</h2>
          <p className="mt-3 max-w-[68ch] text-base leading-7 text-[#405047]">{recommendation.summary}</p>
        </div>

        <div className="border border-[#cab99d] bg-[#fbf4e7] px-4 py-4">
          <p className="text-[0.64rem] font-bold uppercase tracking-[0.14em] text-[#657064]">Why this is the answer</p>
          <ul className="mt-3 space-y-2">
            {recommendation.reasons.map((reason) => (
              <li key={reason} className="flex gap-2 text-sm leading-6 text-[#263b2d]">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#45624f]" aria-hidden />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-2 border-t border-[#cab99d] bg-[#f7f1e5] px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <button
          type="button"
          className={cn(
            "flex min-h-11 items-center justify-center gap-2 border border-[#17211c] px-4 py-2 text-sm font-bold",
            recommendation.primaryDecision === "approved" ? "bg-[#17211c] text-[#fffaf0] hover:bg-[#263b2d]" : "bg-[#934439] text-[#fffaf0] hover:bg-[#743025]",
          )}
          onClick={onPrimaryAction}
        >
          {recommendation.primaryDecision === "approved" ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
          {recommendation.primaryLabel}
        </button>
        <button
          type="button"
          className="flex min-h-11 items-center justify-center gap-2 border border-[#17211c] bg-[#fffaf0] px-4 py-2 text-sm font-bold text-[#17211c] hover:bg-[#fbf4e7]"
          onClick={onShowDetails}
        >
          {recommendation.detailLabel}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </section>
  );
}

function RankingsPanel({ rankings }: { rankings: MentorRanking[] }) {
  return (
    <section className="border border-[#17211c] bg-[#fffaf0]">
      <div className="border-b border-[#9d8f77] bg-[#f7f1e5] px-4 py-4">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Mentor ranking</p>
        <h2 className="mt-1 text-2xl font-semibold leading-tight">Who should move first</h2>
      </div>
      <div className="divide-y divide-[#cab99d]">
        {rankings.map((ranking) => {
          const mentor = getActorById(ranking.mentorId);
          const startup = getActorById(ranking.bestStartupId);

          return (
            <article key={ranking.mentorId} className="grid gap-4 px-4 py-4 md:grid-cols-[44px_minmax(0,1fr)_auto]">
              <div className="flex h-11 w-11 items-center justify-center border border-[#17211c] bg-[#17211c] text-lg font-semibold text-[#fffaf0]">
                {ranking.rank}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-[#17211c]">{mentor.name}</h3>
                  <span className="border border-[#9d8f77] bg-[#fbf4e7] px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#59675e]">
                    {ranking.capacity}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-[#405047]">{ranking.reasoning}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.1em] text-[#59675e]">Best intro: {startup.name}</p>
              </div>
              <p className="self-start text-3xl font-semibold text-[#17211c]">{ranking.score}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SignalFeedPanel({ selectedSignals }: { selectedSignals: Signal[] }) {
  return (
    <section id="relationship-os-signals" tabIndex={-1} className="scroll-mt-4 border border-[#17211c] bg-[#fffaf0] focus:outline-none">
      <div className="border-b border-[#9d8f77] bg-[#f7f1e5] px-4 py-4">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Signal feed</p>
        <h2 className="mt-1 text-2xl font-semibold leading-tight">What the model reads</h2>
      </div>
      <div className="border-b border-[#cab99d] px-4 py-4">
        <ActionCallout
          label="Insight"
          title={selectedSignals[0]?.label ?? "Prioritize the highest-confidence evidence"}
          detail="Each recommendation links back to CSV or WhatsApp/TXT evidence, so the operator can approve the action or request missing evidence with context."
        />
      </div>
      <div className="divide-y divide-[#cab99d]">
        {relationshipOsSnapshot.signals.map((signal) => (
          <SignalRow key={signal.id} signal={signal} />
        ))}
      </div>
    </section>
  );
}

function ProcessedCsvStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="border border-[#cab99d] bg-[#fffaf0] px-3 py-3">
      <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[#657064]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[#17211c]">{value}</p>
      <p className="mt-1 text-xs leading-5 text-[#59675e]">{detail}</p>
    </div>
  );
}

function IngestionPanel({
  queuedEvidenceSource,
  evidenceProcessed,
  isProcessingEvidence,
  processRunCount,
  processedCsvSummary,
  processingError,
  csvEvidence,
  pastedEvidence,
  onQueueEvidence,
  onChangePastedEvidence,
  onUploadCsv,
  onLoadSampleCsv,
  onProcessEvidence,
}: {
  queuedEvidenceSource: string | null;
  evidenceProcessed: boolean;
  isProcessingEvidence: boolean;
  processRunCount: number;
  processedCsvSummary: ProcessedCsvSummary | null;
  processingError: string | null;
  csvEvidence: CsvEvidenceState | null;
  pastedEvidence: string;
  onQueueEvidence: (sourceId: string) => void;
  onChangePastedEvidence: (value: string) => void;
  onUploadCsv: (file: File) => Promise<void>;
  onLoadSampleCsv: () => void;
  onProcessEvidence: () => Promise<void>;
}) {
  const queuedSource = relationshipOsSnapshot.evidenceSources.find((source) => source.id === queuedEvidenceSource);

  return (
    <section className="border border-[#17211c] bg-[#fffaf0]">
      <div className="border-b border-[#9d8f77] bg-[#f7f1e5] px-4 py-4">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Data setup</p>
        <h2 className="mt-1 text-2xl font-semibold leading-tight">Process supported evidence</h2>
        <p className="mt-2 max-w-[76ch] text-sm leading-6 text-[#405047]">
          This demo processes CSV mentor syncs and WhatsApp/TXT exports. PDFs, decks, Google Sheets, Airtable, and Firestore stay out of the live demo until the backend credentials and extractors are connected.
        </p>
      </div>

      <div className="grid gap-3 p-3 md:grid-cols-2">
        {LIVE_EVIDENCE_SOURCE_IDS.map((sourceId) => {
          const source = relationshipOsSnapshot.evidenceSources.find((candidate) => candidate.id === sourceId);

          if (!source) return null;

          return (
            <button key={source.id} type="button" className="text-left" onClick={() => onQueueEvidence(source.id)}>
              <SourceBadge source={source} />
            </button>
          );
        })}
      </div>

      <div className="border-t border-[#9d8f77] bg-[#fffaf0] px-4 py-4">
        <label htmlFor="relationship-os-paste" className="text-sm font-bold text-[#17211c]">
          Paste WhatsApp/TXT evidence
        </label>
        <p className="mt-1 text-xs leading-5 text-[#405047]">
          Paste a chat export, notes, or copied mentor feedback here, then press Process Raw Information.
        </p>
        <textarea
          id="relationship-os-paste"
          className="mt-3 min-h-32 w-full resize-y border border-[#9d8f77] bg-[#fbf4e7] px-3 py-3 text-sm leading-6 text-[#17211c] outline-none placeholder:text-[#7d806e] focus:border-[#17211c]"
          placeholder="Priya: Send me the security review notes and I will mark the buyer committee.&#10;Atlas Founder: We are stuck on security review but the GTM milestone is done."
          value={pastedEvidence}
          onChange={(event) => onChangePastedEvidence(event.currentTarget.value)}
        />
      </div>

      <div className="grid gap-3 border-t border-[#9d8f77] bg-[#fbf4e7] px-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#17211c]">
            {csvEvidence
              ? `${csvEvidence.filename} loaded: ${csvEvidence.rowCount} ${csvEvidence.rowLabel} across ${csvEvidence.participantCount} participants.`
              : pastedEvidence.trim()
                ? "Pasted WhatsApp/TXT evidence is ready to process."
              : "Upload CSV or WhatsApp/TXT evidence from your laptop, or load the sample CSV for the demo."}
          </p>
          {csvEvidence ? (
            <div className="mt-3 grid gap-2">
              {csvEvidence.preview.map((line) => (
                <p key={line} className="border border-[#cab99d] bg-[#fffaf0] px-3 py-2 text-xs leading-5 text-[#405047]">
                  {line}
                </p>
              ))}
            </div>
          ) : null}
          <a
            className="mt-3 inline-flex border border-[#9d8f77] bg-[#fffaf0] px-2 py-1 text-[0.64rem] font-bold uppercase tracking-[0.1em] text-[#59675e] hover:border-[#17211c] hover:text-[#17211c]"
            href={SAMPLE_WHATSAPP_CSV_PATH}
          >
            Open sample CSV
          </a>
        </div>
        <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 border border-[#17211c] bg-[#17211c] px-5 py-2 text-sm font-bold text-[#fffaf0] hover:bg-[#263b2d]">
          <Upload className="h-4 w-4" aria-hidden />
          Upload Evidence
          <input
            className="sr-only"
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            aria-label="Upload CSV or WhatsApp text evidence"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];

              if (file) {
                void onUploadCsv(file);
              }

              event.currentTarget.value = "";
            }}
          />
        </label>
        <button
          type="button"
          className="flex min-h-11 items-center justify-center gap-2 border border-[#17211c] bg-[#fffaf0] px-5 py-2 text-sm font-bold text-[#17211c] hover:bg-[#17211c] hover:text-[#fffaf0]"
          onClick={onLoadSampleCsv}
        >
          <FileText className="h-4 w-4" aria-hidden />
          Load sample CSV
        </button>
      </div>

      <div className={cn("grid gap-3 border-t border-[#9d8f77] px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto]", evidenceProcessed ? "bg-[#dce6d8]" : "bg-[#fbf4e7]")}>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#17211c]" aria-live="polite">
            {isProcessingEvidence
              ? "Processing evidence into relationship signals..."
              : evidenceProcessed
              ? csvEvidence
                ? `Run ${processRunCount}: ${csvEvidence.rowCount} ${csvEvidence.rowLabel} processed into relationship, mentor ranking, and partner intro signals.`
                : `Run ${processRunCount}: Raw information processed into relationship, mentor ranking, and partner intro signals.`
              : csvEvidence
                ? `${csvEvidence.filename} is ready to process.`
                : pastedEvidence.trim()
                  ? "Pasted evidence is ready to process."
                : queuedSource
                ? `${queuedSource.title} queued for extraction.`
                : "Queue a source or process the full demo packet."}
          </p>
          <p className="mt-1 text-xs leading-5 text-[#405047]">
            Backend handoff: {relationshipOsFirebaseContract.functions.map((fn) => fn.name).join(", ")}
          </p>
          {evidenceProcessed ? (
            <p className="mt-2 w-fit border border-[#45624f] bg-[#fffaf0] px-2 py-1 text-[0.64rem] font-bold uppercase tracking-[0.1em] text-[#263b2d]">
              Dashboard snapshot refreshed
            </p>
          ) : null}
          {processingError ? (
            <p className="mt-2 border border-[#934439] bg-[#f4d8ce] px-3 py-2 text-xs font-bold text-[#743025]">
              {processingError}
            </p>
          ) : null}
          {processedCsvSummary ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <ProcessedCsvStat
                label={processedCsvSummary.rowLabel}
                value={`${processedCsvSummary.rowCount}`}
                detail={csvEvidence?.filename === "Pasted WhatsApp/TXT evidence" ? "parsed from paste" : "parsed from file"}
              />
              <ProcessedCsvStat label={processedCsvSummary.relationshipLabel} value={`${processedCsvSummary.relationshipCount}`} detail={processedCsvSummary.relationshipDetail} />
              <ProcessedCsvStat label="Blockers" value={`${processedCsvSummary.blockerCount}`} detail={`${processedCsvSummary.unresolvedAskCount} unresolved asks`} />
              <ProcessedCsvStat label={processedCsvSummary.topActorLabel} value={processedCsvSummary.topMentorName} detail={`${processedCsvSummary.topMentorScore}% fit score`} />
              <ProcessedCsvStat label="Partner signals" value={`${processedCsvSummary.partnerSignalCount}`} detail="intro, grant, or pilot cues" />
              <ProcessedCsvStat label={csvEvidence?.kind === "text" ? "Warmth cues" : "Avg confidence"} value={processedCsvSummary.confidenceValue} detail={processedCsvSummary.confidenceDetail} />
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="flex min-h-11 items-center justify-center gap-2 border border-[#17211c] bg-[#17211c] px-5 py-2 text-sm font-bold text-[#fffaf0] hover:bg-[#263b2d]"
          disabled={isProcessingEvidence}
          onClick={onProcessEvidence}
        >
          <Upload className="h-4 w-4" aria-hidden />
          {isProcessingEvidence ? "Processing Evidence" : evidenceProcessed ? "Reprocess Raw Information" : "Process Raw Information"}
        </button>
      </div>
    </section>
  );
}

export default function RelationshipOSDemo() {
  const [selectedStartupId, setSelectedStartupId] = useState("startup-atlas-ai");
  const [activeLens, setActiveLens] = useState<LensId>("relationships");
  const [selectedActionId, setSelectedActionId] = useState("action-atlas-priya");
  const [queuedEvidenceSource, setQueuedEvidenceSource] = useState<string | null>("whatsapp-export");
  const [evidenceProcessed, setEvidenceProcessed] = useState(false);
  const [isProcessingEvidence, setIsProcessingEvidence] = useState(false);
  const [processRunCount, setProcessRunCount] = useState(0);
  const [processedCsvSummary, setProcessedCsvSummary] = useState<ProcessedCsvSummary | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [csvEvidence, setCsvEvidence] = useState<CsvEvidenceState | null>(null);
  const [pastedEvidence, setPastedEvidence] = useState("");
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [expandedLens, setExpandedLens] = useState<LensId | null>(null);
  const [rawInfoOpen, setRawInfoOpen] = useState(false);

  const startupActions = useMemo(
    () => relationshipOsSnapshot.actions.filter((action) => action.actorIds.includes(selectedStartupId)),
    [selectedStartupId],
  );

  const visibleActions = useMemo(() => {
    const scopedActions = activeLens === "evidence" ? startupActions : startupActions.filter((action) => action.lensId === activeLens);

    return scopedActions.length > 0 ? scopedActions : startupActions.length > 0 ? startupActions : relationshipOsSnapshot.actions;
  }, [activeLens, startupActions]);

  const defaultAction = getDefaultActionForContext(activeLens, selectedStartupId);
  const selectedAction = visibleActions.find((action) => action.id === selectedActionId) ?? defaultAction;
  const selectedRelationship = getRelationshipById(selectedAction.relationshipId);
  const selectedSignals = selectedAction.signals
    .map((signalId) => relationshipOsSnapshot.signals.find((signal) => signal.id === signalId))
    .filter((signal): signal is Signal => Boolean(signal));
  const recommendation = getRecommendationCopy(activeLens, selectedAction, selectedStartupId);

  function selectLens(lensId: LensId) {
    setActiveLens(lensId);
    setExpandedLens(null);
    const firstAction = getDefaultActionForContext(lensId, selectedStartupId);

    if (firstAction) {
      setSelectedActionId(firstAction.id);
    }
  }

  function selectStartup(startupId: string) {
    setSelectedStartupId(startupId);
    setExpandedLens(null);
    const firstAction = getDefaultActionForContext(activeLens, startupId);

    if (firstAction) {
      setSelectedActionId(firstAction.id);
    }
  }

  function scrollToSection(sectionId: string) {
    window.setTimeout(() => {
      const section = document.getElementById(sectionId);
      section?.scrollIntoView({ block: "start" });

      if (section instanceof HTMLElement) {
        section.focus({ preventScroll: true });
      }
    }, 0);
  }

  function jumpToHeaderMetric(target: "companies" | "mentors" | "decisions") {
    if (target === "decisions") {
      setActiveLens("relationships");
      setSelectedActionId(getDefaultActionForContext("relationships", selectedStartupId).id);
      setExpandedLens(null);
      scrollToSection("relationship-os-page");
      return;
    }

    if (target === "mentors") {
      setActiveLens("mentor-ranking");
      setSelectedActionId(getDefaultActionForContext("mentor-ranking", selectedStartupId).id);
      setExpandedLens(null);
      scrollToSection("relationship-os-page");
      return;
    }

    scrollToSection("relationship-os-company-picker");
  }

  function showDetails() {
    setExpandedLens(activeLens);
    scrollToSection("relationship-os-detail");
  }

  function recordDecision(actionId: string, decision: Decision) {
    setDecisions((current) => ({ ...current, [actionId]: decision }));
  }

  function queueEvidence(sourceId: string) {
    setQueuedEvidenceSource(sourceId);
    setEvidenceProcessed(false);
    setProcessRunCount(0);
    setProcessedCsvSummary(null);
    setProcessingError(null);
  }

  function changePastedEvidence(value: string) {
    setPastedEvidence(value);
    setEvidenceProcessed(false);
    setProcessRunCount(0);
    setProcessedCsvSummary(null);
    setProcessingError(null);

    if (value.trim()) {
      setCsvEvidence(null);
      setQueuedEvidenceSource("whatsapp-export");
    }
  }

  async function readSampleCsv() {
    const response = await fetch(SAMPLE_WHATSAPP_CSV_PATH);
    if (!response.ok) {
      throw new Error(`Could not load ${SAMPLE_WHATSAPP_CSV_PATH}`);
    }

    const csvText = await response.text();

    return summarizeCsvEvidence("relationship-os-whatsapp-sync.csv", csvText);
  }

  async function loadSampleCsv() {
    const csvState = await readSampleCsv();
    setCsvEvidence(csvState);
    setPastedEvidence("");
    setQueuedEvidenceSource("csv-may-sync");
    setEvidenceProcessed(false);
    setProcessRunCount(0);
    setProcessedCsvSummary(null);
    setProcessingError(null);
  }

  async function uploadCsv(file: File) {
    setProcessingError(null);

    try {
      const isCsv = file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv";
      const isText = file.name.toLowerCase().endsWith(".txt") || file.type === "text/plain";

      if (!isCsv && !isText) {
        throw new Error("Upload CSV mentor syncs or WhatsApp/TXT exports for this demo.");
      }

      const fileText = await file.text();
      const csvState = isCsv ? summarizeCsvEvidence(file.name, fileText) : summarizeTextEvidence(file.name, fileText);

      if (csvState.rowCount === 0) {
        throw new Error("That evidence file did not contain any usable rows or messages.");
      }

      setCsvEvidence(csvState);
      setPastedEvidence("");
      setQueuedEvidenceSource(csvState.kind === "text" ? "whatsapp-export" : "csv-may-sync");
      setEvidenceProcessed(false);
      setProcessRunCount(0);
      setProcessedCsvSummary(null);
    } catch (error) {
      setProcessingError(error instanceof Error ? error.message : "CSV upload failed.");
    }
  }

  async function processEvidence() {
    setIsProcessingEvidence(true);
    setProcessingError(null);

    try {
      const csvState = csvEvidence ?? (pastedEvidence.trim() ? summarizeTextEvidence("Pasted WhatsApp/TXT evidence", pastedEvidence) : await readSampleCsv());
      setCsvEvidence(csvState);
      setQueuedEvidenceSource(csvState.kind === "text" ? "whatsapp-export" : "csv-may-sync");
      setProcessedCsvSummary(processCsvEvidenceRows(csvState));
      setEvidenceProcessed(true);
      setProcessRunCount((current) => current + 1);
    } catch (error) {
      setProcessingError(error instanceof Error ? error.message : "CSV processing failed.");
    } finally {
      setIsProcessingEvidence(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#ede4d1] text-[#17211c]" style={{ fontFamily: 'Charter, "Iowan Old Style", "Hoefler Text", Georgia, serif' }}>
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="grid gap-4 border border-[#17211c] bg-[#fffaf0] px-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="border border-[#17211c] bg-[#17211c] px-2 py-1 text-[0.64rem] font-bold uppercase tracking-[0.14em] text-[#fffaf0]">
                Comparison route
              </span>
              <span className="border border-[#9d8f77] bg-[#f7f1e5] px-2 py-1 text-[0.64rem] font-bold uppercase tracking-[0.14em] text-[#59675e]">
                {relationshipOsSnapshot.ecosystemName}
              </span>
            </div>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-[0.98] tracking-normal md:text-6xl">
              Relationship OS for ecosystem operators
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#405047] md:text-base">
              Pick a company first, then see who to deploy, why they fit, and what proof supports the decision.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:max-w-[360px] lg:justify-end">
            <CompactMetricButton
              label="Companies"
              value={`${startupIds.length}`}
              onClick={() => jumpToHeaderMetric("companies")}
            />
            <CompactMetricButton
              label="Mentors"
              value={`${relationshipOsSnapshot.mentorRankings.length}`}
              onClick={() => jumpToHeaderMetric("mentors")}
            />
            <CompactMetricButton
              label="Decisions"
              value={`${relationshipOsSnapshot.actions.length}`}
              onClick={() => jumpToHeaderMetric("decisions")}
            />
          </div>
        </header>

        <StartupSelector selectedStartupId={selectedStartupId} onSelectStartup={selectStartup} />

        <LensBar activeLens={activeLens} onSelectLens={selectLens} />

        <section id="relationship-os-page" tabIndex={-1} className="scroll-mt-4 grid gap-5 focus:outline-none">
          <PrimaryRecommendationCard
            recommendation={recommendation}
            decision={decisions[selectedAction.id]}
            onPrimaryAction={() => recordDecision(selectedAction.id, recommendation.primaryDecision)}
            onShowDetails={showDetails}
          />

          <details
            id="relationship-os-detail"
            open={expandedLens === activeLens}
            onToggle={(event) => setExpandedLens(event.currentTarget.open ? activeLens : null)}
            className="border border-[#17211c] bg-[#fffaf0]"
          >
            <summary className="cursor-pointer list-none border-b border-[#9d8f77] bg-[#f7f1e5] px-4 py-4 marker:hidden">
              <span className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <span>
                  <span className="block text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Drill-down</span>
                  <span className="mt-1 block text-2xl font-semibold leading-tight text-[#17211c]">Evidence and detail for this recommendation</span>
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.1em] text-[#59675e]">
                  {expandedLens === activeLens ? "Hide details" : "Show details"}
                </span>
              </span>
            </summary>

            {activeLens === "relationships" ? (
              <div className="grid gap-5 p-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <ActionQueue actions={visibleActions} activeActionId={selectedAction.id} decisions={decisions} onSelectAction={setSelectedActionId} />
                <SelectedInsightPanel
                  selectedAction={selectedAction}
                  selectedRelationship={selectedRelationship}
                  decisions={decisions}
                  onRecordDecision={recordDecision}
                />
              </div>
            ) : null}

            {activeLens === "mentor-ranking" ? (
              <div className="grid gap-5 p-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <RankingsPanel rankings={relationshipOsSnapshot.mentorRankings} />
                <SelectedInsightPanel
                  selectedAction={selectedAction}
                  selectedRelationship={selectedRelationship}
                  decisions={decisions}
                  onRecordDecision={recordDecision}
                />
              </div>
            ) : null}

            {activeLens === "partner-intros" ? (
              <div className="grid gap-5 p-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <ActionQueue actions={visibleActions} activeActionId={selectedAction.id} decisions={decisions} onSelectAction={setSelectedActionId} />
                <SelectedInsightPanel
                  selectedAction={selectedAction}
                  selectedRelationship={selectedRelationship}
                  decisions={decisions}
                  onRecordDecision={recordDecision}
                />
              </div>
            ) : null}

            {activeLens === "evidence" ? (
              <div className="grid gap-5 p-4 xl:grid-cols-[minmax(0,1fr)_420px]">
                <SignalFeedPanel selectedSignals={selectedSignals} />
                <section className="border border-[#17211c] bg-[#fffaf0]">
                  <div className="border-b border-[#9d8f77] bg-[#f7f1e5] px-4 py-4">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Evidence sources</p>
                    <h2 className="mt-1 text-2xl font-semibold leading-tight">What has been processed</h2>
                  </div>
                  <div className="grid gap-3 p-3">
                    {relationshipOsSnapshot.evidenceSources.map((source) => (
                      <SourceBadge key={source.id} source={source} />
                    ))}
                  </div>
                </section>
              </div>
            ) : null}
          </details>
        </section>

        <details
          id="relationship-os-raw-info"
          open={rawInfoOpen}
          onToggle={(event) => setRawInfoOpen(event.currentTarget.open)}
          className="border border-[#17211c] bg-[#fffaf0]"
        >
          <summary className="cursor-pointer list-none border-b border-[#9d8f77] bg-[#f7f1e5] px-4 py-4 marker:hidden">
            <span className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <span>
                <span className="block text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Optional add-on</span>
                <span className="mt-1 block text-2xl font-semibold leading-tight text-[#17211c]">Add raw information later</span>
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-[#59675e]">
                {rawInfoOpen ? "Hide upload tools" : "Open CSV and paste tools"}
              </span>
            </span>
          </summary>
          <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <IngestionPanel
              queuedEvidenceSource={queuedEvidenceSource}
              evidenceProcessed={evidenceProcessed}
              isProcessingEvidence={isProcessingEvidence}
              processRunCount={processRunCount}
              processedCsvSummary={processedCsvSummary}
              processingError={processingError}
              csvEvidence={csvEvidence}
              pastedEvidence={pastedEvidence}
              onQueueEvidence={queueEvidence}
              onChangePastedEvidence={changePastedEvidence}
              onUploadCsv={uploadCsv}
              onLoadSampleCsv={loadSampleCsv}
              onProcessEvidence={processEvidence}
            />

            <aside className="border border-[#17211c] bg-[#fffaf0] px-4 py-4">
              <div className="flex h-10 w-10 items-center justify-center border border-[#17211c] bg-[#17211c] text-[#fffaf0]">
                <ShieldCheck className="h-5 w-5" aria-hidden />
              </div>
              <h2 className="mt-5 text-2xl font-semibold leading-tight">Backend-ready contract</h2>
              <p className="mt-3 text-sm leading-6 text-[#405047]">
                The mock snapshot is shaped around Firebase collections and callable functions, so the route can move from local demo data to a real Google-backed store.
              </p>
              <div className="mt-5 space-y-2">
                {relationshipOsFirebaseContract.collections.slice(0, 4).map((collection) => (
                  <p key={collection} className="break-words border border-[#cab99d] bg-[#fbf4e7] px-3 py-2 text-xs font-bold text-[#405047]">
                    {collection}
                  </p>
                ))}
              </div>
            </aside>
          </div>
        </details>

        <footer className="flex flex-col gap-3 border border-[#17211c] bg-[#17211c] px-5 py-4 text-[#fffaf0] md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-semibold">Cohort Atlas, Relationship OS comparison surface</p>
          <div className="flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.1em] text-[#d9cfbd]">
            <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" aria-hidden /> May 2026 packet</span>
            <span className="inline-flex items-center gap-1"><Globe2 className="h-3.5 w-3.5" aria-hidden /> Google-ready</span>
            <span className="inline-flex items-center gap-1"><UserCheck className="h-3.5 w-3.5" aria-hidden /> Human approval loop</span>
            <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" aria-hidden /> Demo branch only</span>
            <span className="inline-flex items-center gap-1"><Users2 className="h-3.5 w-3.5" aria-hidden /> Shared mock data</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
