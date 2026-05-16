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
  ShieldCheck,
  Trophy,
  Upload,
  UserCheck,
  Users2,
} from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
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
  rawText?: string;
};

type WhatsAppTag = "ask" | "blocker" | "follow-up" | "missing-evidence" | "partner" | "warmth";

type WhatsAppMessage = {
  id: string;
  lineNumber: number;
  timestamp: string;
  speaker: string;
  body: string;
  rawLine: string;
  startupId: string | null;
  tags: WhatsAppTag[];
};

type EvidenceLine = {
  id: string;
  lineNumber: number;
  speaker: string;
  text: string;
  rawLine: string;
};

type WhatsAppInsight = {
  startupId: string;
  title: string;
  summary: string;
  status: ActionStatus;
  confidence: number;
  reasons: string[];
  primaryLabel: string;
  primaryDecision: Decision;
  evidenceLines: EvidenceLine[];
};

type WhatsAppAnalysis = {
  sourceLabel: string;
  messageCount: number;
  participantCount: number;
  blockerCount: number;
  unresolvedAskCount: number;
  followUpCount: number;
  partnerCueCount: number;
  validationIssues: string[];
  messages: WhatsAppMessage[];
  insights: Record<string, WhatsAppInsight>;
};

const DEMO_WHATSAPP_THREAD = `[15/05/2026, 09:02] Atlas Founder (Maya): Priya, Atlas AI is stuck. The enterprise buyer likes the pilot, but security review keeps bouncing between IT and procurement.
[15/05/2026, 09:08] Priya Raman: Send me the security objections and the buying committee names. I will map who owns the rollout risk.
[15/05/2026, 11:41] Atlas Founder (Maya): Sent the notes here. They keep asking who signs off data access. We also promised a pilot timeline, but I am not sure who approves it.
[15/05/2026, 17:22] Priya Raman: Good progress. Next step: book a 30 minute follow-up. We should rewrite the security narrative around procurement owner, data access, and rollout risk.
[16/05/2026, 08:14] BWAI Admin (Sara): Atlas follow-up is not on the calendar yet. The security note is still only in WhatsApp.
[15/05/2026, 10:03] CarbonLoop Founder (Jia): Farah, CarbonLoop has the June grant deadline. We need to know which climate evidence matters before GreenBridge sees the pilot.
[15/05/2026, 10:16] Farah Lim: The grant story is promising. Please send warehouse pilot economics, recycling volume, and cost savings before any GreenBridge introduction.
[15/05/2026, 14:48] CarbonLoop Founder (Jia): We have recycling volume, but the warehouse cost savings are still missing. I can send rough numbers by Friday.
[15/05/2026, 18:05] BWAI Admin (Sara): Hold the GreenBridge intro until the pilot economics are in one page. Otherwise the partner will ask for evidence we cannot show.
[15/05/2026, 08:55] Nora Founder (Lina): Alicia, Nora Health has a hospital champion excited, but our one-pager says we guarantee reduced clinical admin time.
[15/05/2026, 09:31] Alicia Mensah: That wording is too absolute for first hospital outreach. Please soften the claim and show workflow evidence instead.
[15/05/2026, 13:12] Nora Founder (Lina): Thanks, I can revise it. Should we still ask for the hospital introduction this week?
[15/05/2026, 16:44] Alicia Mensah: Review first, introduction second. Send me the one-pager and I will mark the risky claims.
[16/05/2026, 08:26] BWAI Admin (Sara): Nora hospital intro is blocked until Alicia reviews the one-pager. This decision is buried in the WhatsApp thread.`;

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

const statusClasses: Record<ActionStatus | "Approved", string> = {
  "Auto-ready": "border-[#b4c0b0] bg-[#dce6d8] text-[#657064]",
  "Review suggested": "border-[#cab99d] bg-[#f7f1e5] text-[#59675e]",
  "Manual evidence needed": "border-[#c9b0a7] bg-[#f4d8ce] text-[#7d5149]",
  Approved: "border-[#b4c0b0] bg-[#dce6d8] text-[#657064]",
};

const statusLabels: Record<ActionStatus | "Approved", string> = {
  "Auto-ready": "Ready to approve",
  "Review suggested": "Review suggested",
  "Manual evidence needed": "Needs review",
  Approved: "Approved",
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
    partner: "No partner introduction yet",
  },
  "startup-carbonloop": {
    label: "CarbonLoop",
    stage: "Pre-seed",
    need: "Grant deadline needs climate finance evidence.",
    mentor: "Farah Lim",
    partner: "GreenBridge Labs",
  },
  "startup-nora-health": {
    label: "Nora Health",
    stage: "Seed",
    need: "Clinical language needs compliance review.",
    mentor: "Alicia Mensah",
    partner: "Hold partner introductions",
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
    preview: rows.slice(0, 3).map((row) => `${row.mentor_name} with ${row.startup_name}: ${row.blockers_identified}`),
    rawText: csvText,
  };
}

function normalizeParticipantId(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function detectStartupId(text: string) {
  const lowerText = text.toLowerCase();

  if (lowerText.includes("atlas") || lowerText.includes("priya") || lowerText.includes("maya") || lowerText.includes("procurement") || lowerText.includes("security")) return "startup-atlas-ai";
  if (lowerText.includes("carbonloop") || lowerText.includes("farah") || lowerText.includes("jia") || lowerText.includes("greenbridge") || lowerText.includes("warehouse") || lowerText.includes("climate") || lowerText.includes("grant")) return "startup-carbonloop";
  if (lowerText.includes("nora") || lowerText.includes("alicia") || lowerText.includes("lina") || lowerText.includes("hospital") || lowerText.includes("clinical") || lowerText.includes("one-pager") || lowerText.includes("risky claims")) return "startup-nora-health";

  return null;
}

function classifyWhatsAppTags(message: string): WhatsAppTag[] {
  const lowerMessage = message.toLowerCase();
  const tags: WhatsAppTag[] = [];

  if (/\?|can you|could you|please|send me|should we|need to|need you|waiting for/.test(lowerMessage)) {
    tags.push("ask");
  }

  if (/stuck|blocked|blocker|bouncing|missing|not sure|not ready|risk|too absolute|keeps asking|cannot show|unsure/.test(lowerMessage)) {
    tags.push("blocker");
  }

  if (/next step|follow-up|book|schedule|send|review|mark|rewrite|map|revise|i will|we should/.test(lowerMessage)) {
    tags.push("follow-up");
  }

  if (/still only in whatsapp|not on the calendar|missing|before any|before greenbridge|cannot show|blocked until|buried/.test(lowerMessage)) {
    tags.push("missing-evidence");
  }

  if (/partner|intro|introduction|greenbridge|hospital|buyer|pilot|grant/.test(lowerMessage)) {
    tags.push("partner");
  }

  if (/thanks|good progress|promising|excited|likes the pilot|helpful|appreciate/.test(lowerMessage)) {
    tags.push("warmth");
  }

  return tags;
}

function parseWhatsAppMessages(text: string): WhatsAppMessage[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const whatsappMatch = line.match(/^\[?([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4},?\s+[0-9]{1,2}:[0-9]{2}(?:\s?[APMapm]{2})?)\]?\s*([^:]{2,80}):\s*(.+)$/);
      const simpleSpeakerMatch = line.match(/^([^:]{2,80}):\s*(.+)$/);
      const timestamp = whatsappMatch?.[1]?.trim() ?? "";
      const speaker = (whatsappMatch?.[2] ?? simpleSpeakerMatch?.[1] ?? `Line ${index + 1}`).trim();
      const body = (whatsappMatch?.[3] ?? simpleSpeakerMatch?.[2] ?? line).trim();
      const startupId = detectStartupId(`${speaker} ${body}`);

      return {
        id: `whatsapp-line-${index + 1}`,
        lineNumber: index + 1,
        timestamp,
        speaker,
        body,
        rawLine: line,
        startupId,
        tags: classifyWhatsAppTags(body),
      };
    });
}

function toEvidenceLines(messages: WhatsAppMessage[], preferredTags: WhatsAppTag[]) {
  const preferred = messages.filter((message) => preferredTags.some((tag) => message.tags.includes(tag)));
  const source = preferred.length >= 2 ? preferred : messages;

  return source.slice(0, 3).map<EvidenceLine>((message) => ({
    id: message.id,
    lineNumber: message.lineNumber,
    speaker: message.speaker,
    text: message.body,
    rawLine: message.rawLine,
  }));
}

function buildInsightForStartup(startupId: string, messages: WhatsAppMessage[]): WhatsAppInsight {
  const blockerCount = messages.filter((message) => message.tags.includes("blocker")).length;
  const askCount = messages.filter((message) => message.tags.includes("ask")).length;
  const followUpCount = messages.filter((message) => message.tags.includes("follow-up")).length;
  const missingEvidenceCount = messages.filter((message) => message.tags.includes("missing-evidence")).length;
  const partnerCueCount = messages.filter((message) => message.tags.includes("partner")).length;
  const baseConfidence = Math.min(94, 58 + blockerCount * 6 + followUpCount * 5 + askCount * 4 + partnerCueCount * 3);

  if (startupId === "startup-carbonloop") {
    return {
      startupId,
      title: "Review pilot economics before the GreenBridge introduction",
      summary: `The thread mentions the partner path ${partnerCueCount} time${partnerCueCount === 1 ? "" : "s"} and shows ${missingEvidenceCount} missing proof point${missingEvidenceCount === 1 ? "" : "s"}. Hold the introduction until the pilot economics are ready.`,
      status: missingEvidenceCount > 0 ? "Manual evidence needed" : "Review suggested",
      confidence: Math.min(88, baseConfidence),
      reasons: [
        "GreenBridge comes up in the same thread as the grant deadline.",
        "The founder says cost-savings evidence is still missing.",
        "The admin note says to wait before making the introduction.",
      ],
      primaryLabel: "Review pilot economics",
      primaryDecision: "needs_evidence",
      evidenceLines: toEvidenceLines(messages, ["partner", "missing-evidence", "blocker"]),
    };
  }

  if (startupId === "startup-nora-health") {
    return {
      startupId,
      title: "Ask Alicia to review Nora's one-pager before hospital outreach",
      summary: `The thread shows ${blockerCount} clinical risk point${blockerCount === 1 ? "" : "s"} and ${followUpCount} planned follow-up${followUpCount === 1 ? "" : "s"}. Review the one-pager before any hospital introduction.`,
      status: "Review suggested",
      confidence: Math.min(84, baseConfidence),
      reasons: [
        "The one-pager uses language Alicia calls too absolute.",
        "The founder asks whether the hospital introduction should still happen.",
        "Alicia and the admin both say the review comes first.",
      ],
      primaryLabel: "Review advisor notes",
      primaryDecision: "needs_evidence",
      evidenceLines: toEvidenceLines(messages, ["blocker", "ask", "follow-up"]),
    };
  }

  return {
    startupId,
    title: "Schedule Priya's follow-up with Atlas AI",
    summary: `The thread shows ${blockerCount} procurement risk point${blockerCount === 1 ? "" : "s"} and ${followUpCount} planned follow-up${followUpCount === 1 ? "" : "s"}. Schedule the follow-up around security owner, data access, and rollout risk.`,
    status: missingEvidenceCount > 0 ? "Review suggested" : "Auto-ready",
    confidence: Math.min(91, baseConfidence),
    reasons: [
      "Atlas repeats the same security and procurement issue.",
      "Priya gives a concrete follow-up plan.",
      "The admin note shows the follow-up never made it onto the calendar.",
    ],
    primaryLabel: "Schedule follow-up",
    primaryDecision: "approved",
    evidenceLines: toEvidenceLines(messages, ["blocker", "follow-up", "missing-evidence"]),
  };
}

function analyzeWhatsAppThread(text: string): WhatsAppAnalysis {
  const messages = parseWhatsAppMessages(text);
  const participants = new Set(messages.map((message) => message.speaker));
  const validationIssues: string[] = [];
  const insights = startupIds.reduce<Record<string, WhatsAppInsight>>((current, startupId) => {
    const startupMessages = messages.filter((message) => message.startupId === startupId);

    if (startupMessages.length === 0) {
      validationIssues.push(`${startupBriefs[startupId].label} has no WhatsApp messages linked to it.`);
      return current;
    }

    current[startupId] = buildInsightForStartup(startupId, startupMessages);
    return current;
  }, {});

  if (messages.some((message) => !message.startupId)) {
    validationIssues.push("Some WhatsApp messages need review because they were not linked to a company.");
  }

  return {
    sourceLabel: "Demo WhatsApp thread",
    messageCount: messages.length,
    participantCount: participants.size,
    blockerCount: messages.filter((message) => message.tags.includes("blocker")).length,
    unresolvedAskCount: messages.filter((message) => message.tags.includes("ask")).length,
    followUpCount: messages.filter((message) => message.tags.includes("follow-up")).length,
    partnerCueCount: messages.filter((message) => message.tags.includes("partner")).length,
    validationIssues,
    messages,
    insights,
  };
}

function summarizeTextEvidence(filename: string, text: string): CsvEvidenceState {
  const messages = parseWhatsAppMessages(text);
  const rows = messages.map((message) => {
    const lowerMessage = message.body.toLowerCase();

    return {
      mentor_id: `participant-${normalizeParticipantId(message.speaker) || message.lineNumber}`,
      startup_id: message.startupId ?? "uploaded-text-evidence",
      mentor_name: message.speaker,
      startup_name: message.startupId ? startupBriefs[message.startupId].label : "Uploaded evidence",
      hours_synced: "0",
      milestones_completed: /(done|completed|drafted|sent|shared|finished|mapped|reviewed)/i.test(message.body) ? message.body : "",
      blockers_identified: message.tags.includes("blocker")
        ? message.body
        : "",
      founder_confidence_score: "",
      mentor_confidence_score: "",
      whatsapp_chat_excerpt: message.body,
      follow_ups: message.tags.includes("follow-up") ? message.body : "",
      unresolved_asks: message.tags.includes("ask") ? message.body : "",
      sentiment_warmth: message.tags.includes("warmth")
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
    sourceLabel: "WhatsApp text",
    rowLabel: "messages",
    rowCount: rows.length,
    mentorCount: participants.size,
    startupCount: 0,
    participantCount: participants.size,
    blockerCount: rows.filter((row) => row.blockers_identified).length,
    rows,
    preview: rows.slice(0, 3).map((row) => `${row.mentor_name}: ${row.whatsapp_chat_excerpt}`),
    rawText: text,
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

function StatusPill({ status }: { status: ActionStatus | "Approved" }) {
  return (
    <span className={cn("inline-flex items-center border px-2 py-1 text-[0.64rem] font-bold uppercase tracking-[0.1em]", statusClasses[status])}>
      {statusLabels[status]}
    </span>
  );
}

function CompactMetricButton({
  label,
  value,
  actionLabel,
  onClick,
}: {
  label: string;
  value: string;
  actionLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="grid min-h-12 min-w-[136px] gap-1 border border-[#17211c] bg-[#fffaf0] px-3 py-2 text-left text-[#17211c] hover:bg-[#fbf4e7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#17211c]"
      onClick={onClick}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#59675e]">{label}</span>
        <span className="text-lg font-semibold leading-none">{value}</span>
      </span>
      <span className="inline-flex items-center gap-1 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#17211c]">
        {actionLabel}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </span>
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
      detail: "Who to assign first",
      metric: `${relationshipOsSnapshot.mentorRankings.length} ranked`,
    },
    "partner-intros": {
      title: "Partners",
      detail: "Warm paths worth taking",
      metric: `${relationshipOsSnapshot.actions.filter((action) => action.lensId === "partner-intros").length} path`,
    },
    evidence: {
      title: "Evidence",
      detail: "Evidence behind it",
      metric: `${relationshipOsSnapshot.signals.length} points`,
    },
  };

  return (
    <nav aria-label="Relationship OS views" className="border border-[#17211c] bg-[#17211c] p-2">
      <div className="grid grid-cols-4 gap-2">
      {relationshipOsSnapshot.lenses.map((lens) => {
        const IconComponent = lensIcons[lens.id];
        const isActive = activeLens === lens.id;
        const copy = tabCopy[lens.id];

        const content = (
          <>
            <IconComponent className="h-4 w-4" aria-hidden />
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-tight sm:text-base">{copy.title}</span>
              <span className={cn("mt-1 hidden text-xs leading-5 sm:block", isActive ? "text-[#c7bba9]" : "text-[#d9cfbd]")}>{copy.detail}</span>
            </span>
            <span className={cn("hidden w-fit border px-2 py-1 text-[0.58rem] font-bold uppercase tracking-[0.1em] sm:block", isActive ? "border-[#4d594f] text-[#c7bba9]" : "border-[#4d594f] text-[#c7bba9]")}>
              {copy.metric}
            </span>
          </>
        );

        if (isActive) {
          return (
            <div
              key={lens.id}
              aria-current="page"
              className="flex min-h-[58px] flex-col items-start justify-center gap-1 border border-[#4d594f] bg-[#24332b] px-2 py-2 text-left text-[#d9cfbd] sm:grid sm:min-h-[72px] sm:grid-cols-[20px_minmax(0,1fr)_auto] sm:items-center sm:gap-3 sm:px-3 sm:py-3"
            >
              {content}
            </div>
          );
        }

        return (
          <button
            key={lens.id}
            type="button"
            className="flex min-h-[58px] flex-col items-start justify-center gap-1 border border-[#4d594f] bg-[#17211c] px-2 py-2 text-left text-[#e5decd] transition-colors hover:bg-[#24332b] sm:grid sm:min-h-[72px] sm:grid-cols-[20px_minmax(0,1fr)_auto] sm:items-center sm:gap-3 sm:px-3 sm:py-3"
            onClick={() => onSelectLens(lens.id)}
          >
            {content}
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
      <div className="flex flex-col gap-3 border-b border-[#9d8f77] bg-[#f7f1e5] px-4 py-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Company in focus</p>
          <h2 className="mt-1 text-2xl font-semibold leading-tight text-[#17211c]">
            {selectedStartup.label}: {selectedStartup.need}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#405047]">Switch company to update the recommendation, mentor fit, partner path, and evidence.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="border border-[#9d8f77] bg-[#fffaf0] px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#59675e]">
            {selectedStartup.stage}
          </span>
          <span className="border border-[#9d8f77] bg-[#fffaf0] px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#59675e]">
            Mentor: {selectedStartup.mentor}
          </span>
        </div>
      </div>

      <div className="grid gap-2 p-2 md:grid-cols-3">
        {startupIds.map((startupId) => {
          const startup = startupBriefs[startupId];
          const isSelected = selectedStartupId === startupId;
          const className = cn(
            "grid gap-2 border px-3 py-3 text-left transition-colors",
            isSelected ? "border-[#9d8f77] bg-[#dce6d8] text-[#17211c]" : "border-[#cab99d] bg-[#fffaf0] text-[#17211c] hover:bg-[#fbf4e7]",
          );
          const content = (
            <>
              <span className="flex items-center justify-between gap-3">
                <span className="text-base font-semibold leading-tight">{startup.label}</span>
                <span className={cn("border px-2 py-1 text-[0.58rem] font-bold uppercase tracking-[0.1em]", isSelected ? "border-[#b4c0b0] text-[#657064]" : "border-[#9d8f77] text-[#59675e]")}>
                  {startup.stage}
                </span>
              </span>
              <span className={cn("mt-1 inline-flex w-fit items-center gap-1 border px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.08em]", isSelected ? "border-[#b4c0b0] bg-[#dce6d8] text-[#657064]" : "border-[#17211c] text-[#17211c]")}>
                {isSelected ? "Selected company" : "Select company"}
                {!isSelected ? <ArrowRight className="h-3.5 w-3.5" aria-hidden /> : null}
              </span>
            </>
          );

          if (isSelected) {
            return (
              <article key={startupId} aria-current="true" className={className}>
                {content}
              </article>
            );
          }

          return (
            <button
              key={startupId}
              type="button"
              className={className}
              onClick={() => onSelectStartup(startupId)}
            >
              {content}
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
        ? "Marked for review before approval"
        : activeAction?.status === "Manual evidence needed"
          ? "Review the missing proof point before approval"
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
          const visibleStatus = decision === "approved" ? "Approved" : action.status;
          const className = cn(
            "grid w-full gap-3 px-4 py-4 text-left transition-colors md:grid-cols-[minmax(0,1fr)_auto]",
            isActive ? "bg-[#dce6d8]" : "bg-[#fffaf0] hover:bg-[#f7f1e5]",
          );
          const content = (
            <>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <StatusPill status={visibleStatus} />
                  <span className="text-[0.64rem] font-bold uppercase tracking-[0.1em] text-[#59675e]">{action.confidence}% confidence</span>
                </span>
                <span className="mt-3 block text-base font-semibold leading-tight text-[#17211c]">{action.title}</span>
                <span className="mt-2 block text-sm leading-6 text-[#405047]">{action.summary}</span>
              </span>
              <span className="flex items-center justify-end self-start text-[#405047]">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 border px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.08em]",
                    isActive ? "border-[#b4c0b0] bg-[#dce6d8] text-[#657064]" : "border-[#17211c] bg-[#fffaf0] text-[#17211c]",
                  )}
                >
                  {isActive ? "Selected decision" : "Open decision"}
                  {!isActive ? <ArrowRight className="h-3.5 w-3.5" aria-hidden /> : null}
                </span>
              </span>
            </>
          );

          if (isActive) {
            return (
              <article key={action.id} aria-current="true" className={className}>
                {content}
              </article>
            );
          }

          return (
            <button
              key={action.id}
              type="button"
              className={className}
              onClick={() => onSelectAction(action.id)}
            >
              {content}
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
  evidenceLines,
  reasoning,
}: {
  selectedAction: Action;
  selectedRelationship: Relationship | null;
  decisions: Record<string, Decision>;
  onRecordDecision: (actionId: string, decision: Decision) => void;
  evidenceLines?: EvidenceLine[];
  reasoning?: string;
}) {
  const [whatsAppEvidenceOpen, setWhatsAppEvidenceOpen] = useState(false);
  const selectedActors = selectedAction.actorIds.map(getActorById);
  const selectedSignals = selectedAction.signals
    .map((signalId) => relationshipOsSnapshot.signals.find((signal) => signal.id === signalId))
    .filter((signal): signal is Signal => Boolean(signal));
  const decision = decisions[selectedAction.id];

  useEffect(() => {
    setWhatsAppEvidenceOpen(false);
  }, [selectedAction.id]);

  return (
    <section className="border border-[#17211c] bg-[#fffaf0]">
      <div className="border-b border-[#9d8f77] bg-[#f7f1e5] px-4 py-4">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Reasoning</p>
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

        <p className="text-base leading-7 text-[#263b2d]">{reasoning ?? selectedAction.aiReasoning}</p>

        {selectedRelationship ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Health" value={`${selectedRelationship.health}`} detail={`${selectedRelationship.baselineHealth} baseline`} />
            <Metric label="Hours synced" value={`${selectedRelationship.hoursSynced}`} detail="last 30 days" />
            <Metric label="Confidence" value={`${selectedRelationship.founderConfidence}/${selectedRelationship.mentorConfidence}`} detail="founder / mentor" />
          </div>
        ) : null}

        {selectedRelationship ? (
          <div className="border border-[#cab99d] bg-[#fbf4e7] px-4 py-4">
            <p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#657064]">Open issue</p>
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

        {evidenceLines?.length ? (
          <div className="border border-[#cab99d] bg-[#fbf4e7] px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#657064]">WhatsApp evidence</p>
                <p className="mt-1 text-sm leading-6 text-[#405047]">Source messages are available for judge review.</p>
              </div>
              <button
                type="button"
                className="inline-flex min-h-10 items-center justify-center gap-2 border border-[#17211c] bg-[#fffaf0] px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#17211c] hover:bg-[#17211c] hover:text-[#fffaf0]"
                aria-expanded={whatsAppEvidenceOpen}
                onClick={() => setWhatsAppEvidenceOpen((current) => !current)}
              >
                {whatsAppEvidenceOpen ? "Hide WhatsApp evidence" : "Show WhatsApp evidence"}
                <ArrowRight className={cn("h-3.5 w-3.5 transition-transform", whatsAppEvidenceOpen ? "rotate-90" : "")} aria-hidden />
              </button>
            </div>

            {whatsAppEvidenceOpen ? (
              <div className="mt-3 space-y-2">
                {evidenceLines.map((line) => (
                  <p key={line.id} className="border border-[#cab99d] bg-[#fffaf0] px-3 py-2 text-xs leading-5 text-[#405047]">
                    <span className="font-bold text-[#17211c]">Line {line.lineNumber}, {line.speaker}:</span> {line.text}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          {decision === "approved" ? (
            <div className="flex min-h-11 flex-1 items-center justify-center gap-2 border border-[#b4c0b0] bg-[#dce6d8] px-4 py-2 text-sm font-bold text-[#657064]">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Approved
            </div>
          ) : (
            <button
              type="button"
              className="flex min-h-11 flex-1 items-center justify-center gap-2 border border-[#17211c] bg-[#fffaf0] px-4 py-2 text-sm font-bold text-[#17211c] hover:bg-[#17211c] hover:text-[#fffaf0]"
              onClick={() => onRecordDecision(selectedAction.id, "approved")}
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Approve next step
            </button>
          )}
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
  status: ActionStatus | "Approved";
  confidence: number;
  reasons: string[];
  primaryLabel: string;
  primaryDecision: Decision;
  detailLabel: string;
  evidenceLines?: EvidenceLine[];
  extractionNote?: string;
  supportingEvidence?: string;
};

function formatGoogleCalendarDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function getNextCalendarSlot() {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(10, 0, 0, 0);

  if (start.getDay() === 0) {
    start.setDate(start.getDate() + 1);
  } else if (start.getDay() === 6) {
    start.setDate(start.getDate() + 2);
  }

  const end = new Date(start);
  end.setMinutes(start.getMinutes() + 30);

  return `${formatGoogleCalendarDate(start)}/${formatGoogleCalendarDate(end)}`;
}

function waitForProcessingAnimation() {
  return new Promise((resolve) => setTimeout(resolve, 900));
}

function buildGoogleCalendarUrl(recommendation: RecommendationCopy, evidenceLines: EvidenceLine[]) {
  const details = [
    recommendation.summary,
    "",
    "Why this matters:",
    ...recommendation.reasons.map((reason) => `- ${reason}`),
    "",
    "Evidence lines:",
    ...evidenceLines.map((line) => `Line ${line.lineNumber}, ${line.speaker}: ${line.text}`),
    "",
    recommendation.supportingEvidence ? `Supporting evidence: ${recommendation.supportingEvidence}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: recommendation.title,
    details,
    dates: getNextCalendarSlot(),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function getRecommendationCopy(activeLens: LensId, action: Action, selectedStartupId: string, whatsAppAnalysis?: WhatsAppAnalysis | null): RecommendationCopy {
  const whatsAppInsight = whatsAppAnalysis?.insights[selectedStartupId];

  if (whatsAppInsight && (activeLens === "relationships" || activeLens === "partner-intros" || activeLens === "evidence")) {
    return {
      contextLabel: `For ${startupBriefs[selectedStartupId].label}`,
      eyebrow: activeLens === "evidence" ? "WhatsApp evidence" : activeLens === "partner-intros" ? "Partner decision" : "Recommended next step",
      title: whatsAppInsight.title,
      summary: whatsAppInsight.summary,
      status: whatsAppInsight.status,
      confidence: whatsAppInsight.confidence,
      reasons: whatsAppInsight.reasons,
      primaryLabel: whatsAppInsight.primaryLabel,
      primaryDecision: whatsAppInsight.primaryDecision,
      detailLabel: "Open full drill-down",
      evidenceLines: whatsAppInsight.evidenceLines,
      extractionNote: `${whatsAppAnalysis.messageCount} WhatsApp messages read. ${whatsAppAnalysis.validationIssues.length} line${whatsAppAnalysis.validationIssues.length === 1 ? "" : "s"} need review.`,
      supportingEvidence: "Cross-checked with monthly mentor check-ins, partner notes, and founder materials already in the evidence set.",
    };
  }

  if (selectedStartupId === "startup-carbonloop") {
    if (activeLens === "mentor-ranking") {
      return {
        contextLabel: "For CarbonLoop",
        eyebrow: "Mentor fit",
        title: "Assign Farah to CarbonLoop's climate finance sprint",
        summary: "CarbonLoop needs sharper grant framing and stronger finance evidence before the June deadline.",
        status: action.status,
        confidence: action.confidence,
        reasons: ["The issue is finance-specific.", "Farah matches climate grants and capital readiness.", "GreenBridge can validate the pilot once economics are ready."],
        primaryLabel: "Assign Farah",
        primaryDecision: "approved",
        detailLabel: "Show ranking details",
      };
    }

    if (activeLens === "partner-intros") {
      return {
        contextLabel: "For CarbonLoop",
        eyebrow: "Partner introduction",
        title: "Wait on the GreenBridge introduction until pilot economics are ready",
        summary: "GreenBridge is relevant, but the introduction should wait until CarbonLoop can show warehouse pilot economics.",
        status: action.status,
        confidence: action.confidence,
        reasons: ["GreenBridge fits the circular logistics pilot.", "Grant timing makes the introduction useful.", "Pilot economics are still missing."],
        primaryLabel: "Review pilot economics",
        primaryDecision: "needs_evidence",
        detailLabel: "Show partner rationale",
      };
    }

    if (activeLens === "evidence") {
      return {
        contextLabel: "For CarbonLoop",
        eyebrow: "Evidence",
        title: "Mentor support is ready; partner approval needs more evidence",
        summary: "The check-in shows urgency and finance need. The partner path still needs warehouse pilot economics.",
        status: "Review suggested",
        confidence: 82,
        reasons: ["The monthly sync confirms the grant deadline.", "The written issue points to finance readiness.", "The partner introduction needs warehouse pilot economics."],
        primaryLabel: "Review pilot economics",
        primaryDecision: "needs_evidence",
        detailLabel: "Show evidence",
      };
    }

    return {
      contextLabel: "For CarbonLoop",
      eyebrow: "Recommended next step",
      title: "Start CarbonLoop's climate finance sprint",
      summary: "Pair CarbonLoop with Farah now, and use GreenBridge only after the pilot evidence is ready.",
      status: action.status,
      confidence: action.confidence,
      reasons: ["The company has a near-term grant deadline.", "The issue is specific enough to act on.", "Farah is the strongest mentor match."],
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
        title: "Ask Alicia to review Nora's clinical language",
        summary: "Nora needs clinical compliance judgment before the team sends new hospital introductions.",
        status: action.status,
        confidence: action.confidence,
        reasons: ["The issue is compliance language.", "Alicia is the best clinical product advisor.", "The next move should stay human-reviewed."],
        primaryLabel: "Assign Alicia review",
        primaryDecision: "approved",
        detailLabel: "Show ranking details",
      };
    }

    if (activeLens === "partner-intros") {
      return {
        contextLabel: "For Nora Health",
        eyebrow: "Partner introduction",
        title: "Hold hospital introductions for now",
        summary: "The fit may be strong later, but the current evidence says the language needs review first.",
        status: "Manual evidence needed",
        confidence: 70,
        reasons: ["Clinical claims sound too absolute.", "Alicia should review the one-pager first.", "A premature introduction creates governance risk."],
        primaryLabel: "Review clinical language",
        primaryDecision: "needs_evidence",
        detailLabel: "Show rationale",
      };
    }

    if (activeLens === "evidence") {
      return {
        contextLabel: "For Nora Health",
        eyebrow: "Evidence",
        title: "Review the clinical claims before any introduction",
        summary: "Nora may be a good partner fit later. Right now, the language needs clinical review first.",
        status: "Review suggested",
        confidence: 76,
        reasons: ["The WhatsApp thread flags clinical language risk.", "The founder has hospital interest.", "The missing step is advisor review."],
        primaryLabel: "Review advisor notes",
        primaryDecision: "needs_evidence",
        detailLabel: "Show evidence",
      };
    }

    return {
      contextLabel: "For Nora Health",
      eyebrow: "Recommended next step",
      title: "Review Nora's clinical language before introductions",
      summary: "The safest useful action is to have Alicia review Nora's one-pager before any hospital introduction goes out.",
      status: action.status,
      confidence: action.confidence,
      reasons: ["Nora has real buyer interest.", "Compliance language is the active issue.", "Alicia is the correct expert for the risk."],
      primaryLabel: "Approve review",
      primaryDecision: "approved",
      detailLabel: "Show why",
    };
  }

  if (activeLens === "mentor-ranking") {
    return {
      contextLabel: "For Atlas AI",
      eyebrow: "Mentor fit",
      title: "Assign Priya to Atlas AI first",
      summary: "Priya is the clearest mentor match because the need, fit, and timing all line up.",
      status: action.status,
      confidence: action.confidence,
      reasons: ["Atlas has a concrete procurement issue.", "Priya has the strongest enterprise GTM fit.", "Founder and mentor ratings are both high."],
      primaryLabel: "Assign mentor",
      primaryDecision: "approved",
      detailLabel: "Show ranking details",
    };
  }

  if (activeLens === "partner-intros") {
    return {
      contextLabel: "For Atlas AI",
      eyebrow: "Partner introduction",
      title: "Hold partner introductions for now",
      summary: "Atlas needs mentor help on procurement before the team makes partner introductions.",
      status: "Manual evidence needed",
      confidence: 67,
      reasons: ["The current issue is buyer risk, not partner access.", "Priya should sharpen the security narrative first.", "A partner introduction would be premature."],
      primaryLabel: "Hold partner introduction",
      primaryDecision: "needs_evidence",
      detailLabel: "Show partner rationale",
    };
  }

  if (activeLens === "evidence") {
    return {
      contextLabel: "For Atlas AI",
      eyebrow: "Evidence",
      title: "Evidence supports a follow-up between Priya and Atlas AI",
      summary: "The evidence points to one clear action: help Atlas explain procurement, security, and rollout risk.",
      status: action.status,
      confidence: action.confidence,
      reasons: ["The WhatsApp thread repeats the procurement delay.", "Monthly ratings are high.", "The issue maps directly to Priya's expertise."],
      primaryLabel: "Approve mentor follow-up",
      primaryDecision: "approved",
      detailLabel: "Show evidence",
    };
  }

  return {
    contextLabel: "For Atlas AI",
    eyebrow: "Recommended next step",
    title: "Schedule a follow-up between Priya and Atlas AI",
    summary: "This is the cleanest next move: the problem is specific, the mentor fit is strong, and both sides rated the relationship highly.",
    status: action.status,
    confidence: action.confidence,
    reasons: ["Atlas is stuck on procurement risk.", "Priya can help with enterprise buyer mapping.", "Founder and mentor ratings are both high."],
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
  calendarUrl,
}: {
  recommendation: RecommendationCopy;
  decision: Decision | undefined;
  onPrimaryAction: () => void;
  onShowDetails: () => void;
  calendarUrl?: string;
}) {
  const visibleStatus = decision === "approved" ? "Approved" : recommendation.status;
  const hasPrimaryAction = Boolean(calendarUrl) || recommendation.primaryDecision === "approved";
  const primaryDecisionAlreadyRecorded = hasPrimaryAction && decision === recommendation.primaryDecision;
  const primaryActionClassName = cn(
    "flex min-h-11 items-center justify-center gap-2 border border-[#17211c] px-4 py-2 text-sm font-bold",
    "bg-[#17211c] text-[#fffaf0] hover:bg-[#263b2d]",
  );
  const primaryActionStaticClassName =
    "flex min-h-11 items-center justify-center gap-2 border border-[#b4c0b0] bg-[#dce6d8] px-4 py-2 text-sm font-bold text-[#657064]";

  return (
    <section className="border border-[#17211c] bg-[#fffaf0]">
      <div className="px-4 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={visibleStatus} />
          <span className="border border-[#9d8f77] bg-[#fbf4e7] px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#59675e]">
            {recommendation.confidence}% confidence
          </span>
          <span className="border border-[#9d8f77] bg-[#f7f1e5] px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#59675e]">
            {recommendation.contextLabel}
          </span>
        </div>
        <p className="mt-5 text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#657064]">{recommendation.eyebrow}</p>
        <h2 className="mt-2 max-w-4xl text-3xl font-semibold leading-tight text-[#17211c] md:text-4xl">{recommendation.title}</h2>
        <p className="mt-3 max-w-[70ch] text-base leading-7 text-[#405047]">{recommendation.summary}</p>
      </div>

      <div className={cn("grid gap-2 border-t border-[#cab99d] bg-[#f7f1e5] px-4 py-4", hasPrimaryAction ? "sm:grid-cols-[minmax(0,1fr)_auto]" : "")}>
        {calendarUrl ? (
          <a
            className={primaryActionClassName}
            href={calendarUrl}
            target="_blank"
            rel="noreferrer"
            onClick={onPrimaryAction}
            aria-label={`${recommendation.primaryLabel}, opens Google Calendar`}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {recommendation.primaryLabel}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        ) : primaryDecisionAlreadyRecorded ? (
          <div className={primaryActionStaticClassName}>
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Approved
          </div>
        ) : hasPrimaryAction ? (
          <button
            type="button"
            className={primaryActionClassName}
            onClick={onPrimaryAction}
            aria-label={recommendation.primaryLabel}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {recommendation.primaryLabel}
          </button>
        ) : null}
        <button
          type="button"
          className={cn(
            "flex min-h-11 items-center justify-center gap-2 border border-[#17211c] bg-[#fffaf0] px-4 py-2 text-sm font-bold text-[#17211c] hover:bg-[#fbf4e7]",
            hasPrimaryAction ? "" : "w-full",
          )}
          onClick={onShowDetails}
          aria-label={`Open full drill-down for ${recommendation.title}`}
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
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.1em] text-[#59675e]">Best match: {startup.name}</p>
              </div>
              <p className="self-start text-3xl font-semibold text-[#17211c]">{ranking.score}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SignalFeedPanel({ selectedSignals, whatsAppAnalysis }: { selectedSignals: Signal[]; whatsAppAnalysis: WhatsAppAnalysis | null }) {
  const dynamicSignals: Signal[] = whatsAppAnalysis
    ? startupIds.map((startupId) => {
        const insight = whatsAppAnalysis.insights[startupId];
        const startupMessages = whatsAppAnalysis.messages.filter((message) => message.startupId === startupId);

        return {
          id: `dynamic-${startupId}`,
          sourceId: "whatsapp-export",
          label: `${startupBriefs[startupId].label}: ${startupMessages.length} WhatsApp messages used`,
          detail: insight?.summary ?? "No linked evidence found for this company.",
          state: insight ? "Extracted" : "Needs review",
        };
      })
    : relationshipOsSnapshot.signals;

  return (
    <section id="relationship-os-signals" tabIndex={-1} className="scroll-mt-4 border border-[#17211c] bg-[#fffaf0] focus:outline-none">
      <div className="border-b border-[#9d8f77] bg-[#f7f1e5] px-4 py-4">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Evidence</p>
        <h2 className="mt-1 text-2xl font-semibold leading-tight">Evidence used</h2>
      </div>
      <div className="border-b border-[#cab99d] px-4 py-4">
        <ActionCallout
          label="Insight"
          title={whatsAppAnalysis ? "WhatsApp context recovered and cross-checked" : selectedSignals[0]?.label ?? "Use the strongest evidence first"}
          detail="WhatsApp is a primary source because decisions often get buried there. The recommendation still checks against mentor check-ins, partner notes, and founder materials."
        />
      </div>
      <div className="divide-y divide-[#cab99d]">
        {dynamicSignals.map((signal) => (
          <SignalRow key={signal.id} signal={signal} />
        ))}
      </div>
    </section>
  );
}

function IngestionPanel({
  isProcessingEvidence,
  processingError,
  csvEvidence,
  pastedEvidence,
  onChangePastedEvidence,
  onUploadCsv,
  onLoadDemoWhatsApp,
  onProcessEvidence,
}: {
  isProcessingEvidence: boolean;
  processingError: string | null;
  csvEvidence: CsvEvidenceState | null;
  pastedEvidence: string;
  onChangePastedEvidence: (value: string) => void;
  onUploadCsv: (file: File) => Promise<void>;
  onLoadDemoWhatsApp: () => void;
  onProcessEvidence: () => Promise<void>;
}) {
  const hasTextInput = pastedEvidence.trim().length > 0;
  const hasUploadedEvidence = Boolean(csvEvidence && csvEvidence.filename !== "Demo WhatsApp thread");
  const canProcess = hasTextInput || hasUploadedEvidence;

  return (
    <section className="border border-[#17211c] bg-[#fffaf0]">
      <div className="border-b border-[#9d8f77] bg-[#f7f1e5] px-4 py-4">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Raw information</p>
        <h2 className="mt-1 text-2xl font-semibold leading-tight">Add evidence for processing</h2>
        <p className="mt-2 max-w-[70ch] text-sm leading-6 text-[#405047]">
          Paste a note, WhatsApp excerpt, or follow-up. Submit it to refresh the recommendation and drill-down evidence.
        </p>
      </div>

      <div className="bg-[#fffaf0] px-4 py-4">
        <label htmlFor="relationship-os-paste" className="text-sm font-bold text-[#17211c]">
          Raw information input
        </label>
        <p className="mt-1 text-xs leading-5 text-[#405047]">
          This starts empty on purpose. Add any new evidence you want the demo to process.
        </p>
        <textarea
          id="relationship-os-paste"
          className="mt-3 min-h-36 w-full resize-y border border-[#9d8f77] bg-[#fbf4e7] px-3 py-3 text-sm leading-6 text-[#17211c] outline-none placeholder:text-[#7d806e] focus:border-[#17211c]"
          placeholder="Paste extra evidence here. Example: founder note, mentor feedback, WhatsApp excerpt, partner update, or admin decision."
          value={pastedEvidence}
          onChange={(event) => onChangePastedEvidence(event.currentTarget.value)}
        />
      </div>

      <div className="grid gap-3 border-t border-[#9d8f77] bg-[#fbf4e7] px-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#17211c]">
            {hasTextInput
              ? "Text input is ready to process."
              : hasUploadedEvidence
                ? `${csvEvidence?.filename} is ready to process.`
                : "Demo WhatsApp thread is already loaded. Add more evidence here when needed."}
          </p>
          {isProcessingEvidence ? (
            <div className="mt-3 flex items-center gap-3 border border-[#45624f] bg-[#fffaf0] px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#263b2d]" aria-live="polite">
              <span className="flex gap-1" aria-hidden>
                <span className="h-2 w-2 animate-pulse bg-[#263b2d]" />
                <span className="h-2 w-2 animate-pulse bg-[#45624f] [animation-delay:120ms]" />
                <span className="h-2 w-2 animate-pulse bg-[#6f7b69] [animation-delay:240ms]" />
              </span>
              Processing evidence
            </div>
          ) : null}
        </div>
        <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 border border-[#17211c] bg-[#fffaf0] px-5 py-2 text-sm font-bold text-[#17211c] hover:bg-[#17211c] hover:text-[#fffaf0]">
          <Upload className="h-4 w-4" aria-hidden />
          Upload file
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
          onClick={onLoadDemoWhatsApp}
        >
          <FileText className="h-4 w-4" aria-hidden />
          Reload demo WhatsApp thread
        </button>
        {canProcess || isProcessingEvidence ? (
          <button
            type="button"
            className="flex min-h-11 items-center justify-center gap-2 border border-[#17211c] bg-[#17211c] px-5 py-2 text-sm font-bold text-[#fffaf0] hover:bg-[#263b2d]"
            disabled={isProcessingEvidence}
            onClick={onProcessEvidence}
          >
            {isProcessingEvidence ? <Activity className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />}
            {isProcessingEvidence ? "Processing" : "Submit raw information"}
          </button>
        ) : (
          <div className="flex min-h-11 items-center justify-center border border-[#9d8f77] bg-[#d9cfbd] px-5 py-2 text-sm font-bold text-[#59675e]">
            Add evidence to submit
          </div>
        )}
      </div>

      {processingError ? (
        <p className="border-t border-[#9d8f77] bg-[#f4d8ce] px-4 py-3 text-xs font-bold text-[#743025]">
          {processingError}
        </p>
      ) : null}
    </section>
  );
}

function createDemoWhatsAppState() {
  const evidence = summarizeTextEvidence("Demo WhatsApp thread", DEMO_WHATSAPP_THREAD);
  const analysis = analyzeWhatsAppThread(DEMO_WHATSAPP_THREAD);

  return {
    evidence,
    analysis,
  };
}

export default function RelationshipOSDemo() {
  const initialDemo = useMemo(() => createDemoWhatsAppState(), []);
  const [selectedStartupId, setSelectedStartupId] = useState("startup-atlas-ai");
  const [activeLens, setActiveLens] = useState<LensId>("relationships");
  const [selectedActionId, setSelectedActionId] = useState("action-atlas-priya");
  const [isProcessingEvidence, setIsProcessingEvidence] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [csvEvidence, setCsvEvidence] = useState<CsvEvidenceState | null>(initialDemo.evidence);
  const [whatsAppAnalysis, setWhatsAppAnalysis] = useState<WhatsAppAnalysis | null>(initialDemo.analysis);
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
  const recommendation = getRecommendationCopy(activeLens, selectedAction, selectedStartupId, whatsAppAnalysis);
  const calendarUrl =
    recommendation.primaryLabel.toLowerCase().includes("schedule")
      ? buildGoogleCalendarUrl(recommendation, recommendation.evidenceLines ?? [])
      : undefined;

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

  function changePastedEvidence(value: string) {
    setPastedEvidence(value);
    setProcessingError(null);
  }

  function revealDemoWhatsAppThread() {
    const demoState = createDemoWhatsAppState();

    setCsvEvidence(demoState.evidence);
    setWhatsAppAnalysis(demoState.analysis);
    setPastedEvidence("");
    setProcessingError(null);
    setRawInfoOpen(true);

    window.setTimeout(() => {
      document.getElementById("relationship-os-raw-info")?.scrollIntoView({ block: "start" });
    }, 0);
  }

  async function uploadCsv(file: File) {
    setProcessingError(null);

    try {
      const isCsv = file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv";
      const isText = file.name.toLowerCase().endsWith(".txt") || file.type === "text/plain";

      if (!isCsv && !isText) {
        throw new Error("Upload a CSV mentor check-in or WhatsApp text export for this demo.");
      }

      const fileText = await file.text();
      const csvState = isCsv ? summarizeCsvEvidence(file.name, fileText) : summarizeTextEvidence(file.name, fileText);

      if (csvState.rowCount === 0) {
        throw new Error("That evidence file did not contain any usable rows or messages.");
      }

      setCsvEvidence(csvState);
      setPastedEvidence("");
    } catch (error) {
      setProcessingError(error instanceof Error ? error.message : "Evidence upload failed.");
    }
  }

  async function processEvidence() {
    setIsProcessingEvidence(true);
    setProcessingError(null);

    try {
      const rawText = pastedEvidence.trim();
      const uploadedEvidence = csvEvidence && csvEvidence.filename !== "Demo WhatsApp thread" ? csvEvidence : null;

      if (!rawText && !uploadedEvidence) {
        throw new Error("Paste raw information or upload a file first.");
      }

      await waitForProcessingAnimation();

      const csvState = rawText ? summarizeTextEvidence("Pasted raw information", rawText) : uploadedEvidence!;
      const analysisText = csvState.rawText ?? (rawText || DEMO_WHATSAPP_THREAD);
      const analysis = csvState.kind === "text" ? analyzeWhatsAppThread(analysisText) : null;
      setCsvEvidence(csvState);
      setWhatsAppAnalysis(analysis);
    } catch (error) {
      setProcessingError(error instanceof Error ? error.message : "Evidence processing failed.");
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
              <span className="border border-[#9d8f77] bg-[#f7f1e5] px-2 py-1 text-[0.64rem] font-bold uppercase tracking-[0.14em] text-[#59675e]">
                X Combinator
              </span>
              <span className="border border-[#9d8f77] bg-[#f7f1e5] px-2 py-1 text-[0.64rem] font-bold uppercase tracking-[0.14em] text-[#59675e]">
                {relationshipOsSnapshot.ecosystemName}
              </span>
            </div>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-[0.98] tracking-normal md:text-6xl">
              X Combinator Relationship OS
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#405047] md:text-base">
              Built for ecosystem teams: pick a company, see the next best action, and inspect the evidence behind it.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:max-w-[360px] lg:justify-end">
            <CompactMetricButton
              label="Companies"
              value={`${startupIds.length}`}
              actionLabel="Choose company"
              onClick={() => jumpToHeaderMetric("companies")}
            />
            <CompactMetricButton
              label="Mentors"
              value={`${relationshipOsSnapshot.mentorRankings.length}`}
              actionLabel="Open ranking"
              onClick={() => jumpToHeaderMetric("mentors")}
            />
            <CompactMetricButton
              label="Decisions"
              value={`${relationshipOsSnapshot.actions.length}`}
              actionLabel="Review queue"
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
            calendarUrl={calendarUrl}
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
                  <span className="block text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">On-demand detail</span>
                  <span className="mt-1 block text-2xl font-semibold leading-tight text-[#17211c]">See the evidence, ranking, and decision history</span>
                </span>
                <span className="inline-flex w-fit items-center gap-1 border border-[#17211c] bg-[#fffaf0] px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#17211c]">
                  {expandedLens === activeLens ? "Close drill-down" : "Open full drill-down"}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
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
                  evidenceLines={recommendation.evidenceLines}
                  reasoning={recommendation.summary}
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
                  evidenceLines={recommendation.evidenceLines}
                  reasoning={recommendation.summary}
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
                  evidenceLines={recommendation.evidenceLines}
                  reasoning={recommendation.summary}
                />
              </div>
            ) : null}

            {activeLens === "evidence" ? (
              <div className="grid gap-5 p-4 xl:grid-cols-[minmax(0,1fr)_420px]">
                <SignalFeedPanel selectedSignals={selectedSignals} whatsAppAnalysis={whatsAppAnalysis} />
                <section className="border border-[#17211c] bg-[#fffaf0]">
                  <div className="border-b border-[#9d8f77] bg-[#f7f1e5] px-4 py-4">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Evidence sources</p>
                    <h2 className="mt-1 text-2xl font-semibold leading-tight">What the recommendation checks</h2>
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
                <span className="mt-1 block text-2xl font-semibold leading-tight text-[#17211c]">Add or inspect raw information</span>
              </span>
              <span className="inline-flex w-fit items-center gap-1 border border-[#17211c] bg-[#fffaf0] px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#17211c]">
                {rawInfoOpen ? "Hide raw information tools" : "Open raw information tools"}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </span>
            </span>
          </summary>
          <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <IngestionPanel
              isProcessingEvidence={isProcessingEvidence}
              processingError={processingError}
              csvEvidence={csvEvidence}
              pastedEvidence={pastedEvidence}
              onChangePastedEvidence={changePastedEvidence}
              onUploadCsv={uploadCsv}
              onLoadDemoWhatsApp={revealDemoWhatsAppThread}
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
          <p className="text-sm font-semibold">X Combinator Relationship OS comparison view</p>
          <div className="flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.1em] text-[#d9cfbd]">
            <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" aria-hidden /> May 2026 data</span>
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
