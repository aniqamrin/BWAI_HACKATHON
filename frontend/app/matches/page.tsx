"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Star, RefreshCw, SlidersHorizontal,
  CheckCircle2, Brain, TrendingUp, MapPin, Briefcase,
  ChevronDown, GitBranch, Building2, Users, DollarSign,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { matchApi, startupsApi, relationshipsApi } from "@/lib/api";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

type MatchMode = "mentor" | "programme" | "investor";

function ArcScore({ score, isTop }: { score: number; isTop?: boolean }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const accent = isTop ? "#7c3aed" : "#2563eb";
  return (
    <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
      <svg width="64" height="64" viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        <motion.circle
          cx="32" cy="32" r={r}
          fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (score / 100) * circ }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </svg>
      <div className="flex flex-col items-center leading-none z-10">
        <span className="text-sm font-bold tabular-nums" style={{ color: accent }}>{Math.round(score)}%</span>
        <span className="text-[8px] uppercase tracking-widest text-muted-foreground font-medium mt-0.5">match</span>
      </div>
    </div>
  );
}

export default function MatchesPage() {
  const [startups, setStartups] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [mode, setMode] = useState<MatchMode>("mentor");
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [startupsLoading, setStartupsLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const [created, setCreated] = useState<Set<string>>(new Set());

  // Load startups on mount
  useEffect(() => {
    startupsApi.getAll().then((res: any) => {
      const list = res.data?.startups || [];
      setStartups(list);
      if (list.length > 0) setSelectedId(list[0].id);
      setStartupsLoading(false);
    }).catch(() => setStartupsLoading(false));
  }, []);

  // Run matching whenever startup or mode changes
  useEffect(() => {
    if (!selectedId) return;
    runMatch();
  }, [selectedId, mode]);

  const runMatch = async () => {
    if (!selectedId) return;
    setMatches([]);
    setLoading(true);
    setCreated(new Set());
    try {
      const res = mode === "mentor"
        ? await matchApi.matchMentors(selectedId, 5) as any
        : mode === "programme"
        ? await matchApi.matchProgrammes(selectedId, 5) as any
        : await matchApi.matchInvestors(selectedId, 5) as any;
      setMatches(res.data?.matches || []);
    } catch {
      toast({ title: "Matching failed — showing cached results", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRelationship = async (match: any) => {
    const key = match.mentor_id || match.programme_id || match.investor_id;
    setCreating(key);
    try {
      await relationshipsApi.create({
        relationship_type: mode === "mentor" ? "mentor_startup" : mode === "programme" ? "startup_programme" : "startup_investor",
        startup_id: selectedId,
        mentor_id: mode === "mentor" ? match.mentor_id : undefined,
        programme_id: mode === "programme" ? match.programme_id : undefined,
        investor_id: mode === "investor" ? match.investor_id : undefined,
        match_score: match.fit_score ?? match.compatibility_score,
        confidence_score: match.confidence_score,
        ai_generated: true,
        ai_reasoning: match.reasoning,
        status: "active",
      });
      setCreated(prev => new Set(prev).add(key));
      toast({ title: "Relationship created!", variant: "success" });
    } catch (err: any) {
      const violations: any[] = err.data?.violations || [];
      if (violations.length > 0) {
        const names = violations.map((v: any) => v.rule_name || v.name || "Rule").join(" · ");
        const detail = violations[0]?.message || "";
        toast({ title: `Governance block: ${names}`, description: detail, variant: "error" });
      } else if ((err.message || "").toLowerCase().includes("governance") || (err.message || "").toLowerCase().includes("blocked")) {
        toast({ title: "Blocked by governance rule", description: err.message, variant: "error" });
      } else {
        toast({ title: "Failed to create relationship", variant: "error" });
      }
    } finally {
      setCreating(null);
    }
  };

  const selectedStartup = startups.find(s => s.id === selectedId);

  return (
    <DashboardLayout>
      <PageHeader
        title="AI Matches"
        description="Gemini scores every possible pair and surfaces the highest-compatibility matches"
        icon={Sparkles}
        badge={matches.length > 0 ? `${matches.length} matches` : undefined}
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Startup selector */}
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <select
            className="w-full appearance-none rounded-xl border border-white/10 bg-card/60 px-4 py-2.5 pr-9 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/40"
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            disabled={startupsLoading}
          >
            {startupsLoading && <option>Loading startups…</option>}
            {startups.map(s => (
              <option key={s.id} value={s.id}>{s.startup_name} — {s.industry}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-xl border border-white/10 bg-card/40 p-0.5 gap-0.5">
          {([["mentor", "Mentors", Brain], ["programme", "Programmes", Building2], ["investor", "Investors", DollarSign]] as const).map(([val, label, Icon]) => (
            <button
              key={val}
              onClick={() => setMode(val)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                mode === val
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <Button
          variant="outline" size="sm"
          onClick={runMatch}
          disabled={loading || !selectedId}
          className="gap-1.5 ml-auto"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          Regenerate
        </Button>
      </div>

      {/* Selected startup context */}
      {selectedStartup && (
        <motion.div
          key={selectedStartup.id}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 p-4 rounded-xl border border-white/8 bg-white/[0.02] flex items-center gap-4 flex-wrap"
        >
          <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-4 h-4 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{selectedStartup.startup_name}</p>
            <p className="text-xs text-muted-foreground">
              {selectedStartup.industry} · {selectedStartup.stage} · {selectedStartup.country}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Verification: <span className="text-foreground font-semibold">{selectedStartup.verification_score}</span></span>
            <span>Risk: <span className={cn("font-semibold", selectedStartup.risk_level === "low" ? "text-green-400" : selectedStartup.risk_level === "high" || selectedStartup.risk_level === "critical" ? "text-red-400" : "text-yellow-400")}>{selectedStartup.risk_level}</span></span>
          </div>
        </motion.div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-72 rounded-2xl shimmer" />
          ))}
        </div>
      )}

      {/* Match cards */}
      {!loading && matches.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {matches.map((match, idx) => {
            const key = match.mentor_id || match.programme_id || match.investor_id;
            const isTop = idx === 0;
            const name = match.mentor_name || match.programme_name || match.firm_name || match.investor_name;
            const subtitle = match.mentor_title && match.mentor_company
              ? `${match.mentor_title} · ${match.mentor_company}`
              : match.organizer
              ? match.organizer
              : match.investment_thesis
              ? match.investment_thesis.slice(0, 60) + (match.investment_thesis.length > 60 ? "…" : "")
              : "";
            const tags: string[] = match.mentor_expertise?.slice(0, 3)
              || match.focus_area?.slice(0, 3)
              || match.focus_industries?.slice(0, 3)
              || [];
            const location = match.mentor_location || match.country || "";
            const score = match.compatibility_score ?? match.fit_score ?? 70;
            const isCreated = created.has(key);
            const isCreating = creating === key;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative"
              >
                {isTop && (
                  <div className="absolute -top-2.5 left-4 z-10">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 shadow-lg shadow-violet-500/20">
                      <Star className="w-2.5 h-2.5 fill-current" /> Top Match
                    </span>
                  </div>
                )}

                <Card glass className={cn("h-full transition-all hover:border-white/20", isTop && "border-violet-500/20")}>
                  <CardContent className="p-5 flex flex-col gap-4 h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold text-white",
                          isTop ? "bg-gradient-to-br from-violet-600 to-blue-600" : "bg-gradient-to-br from-slate-600 to-slate-700"
                        )}>
                          {(name || "?").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
                          {location && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="w-2.5 h-2.5" />{location}
                            </p>
                          )}
                        </div>
                      </div>
                      <ArcScore score={score} isTop={isTop} />
                    </div>

                    <div className="h-px bg-white/8" />

                    {/* Reasoning */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className={cn("w-2.5 h-2.5", isTop ? "text-violet-400" : "text-blue-400")} />
                        <span className={cn("text-[9px] font-semibold uppercase tracking-[0.1em]", isTop ? "text-violet-400" : "text-blue-400")}>
                          Why this match
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {match.reasoning}
                      </p>
                    </div>

                    {/* Focus areas */}
                    {match.recommended_focus_areas?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {match.recommended_focus_areas.slice(0, 3).map((area: string) => (
                          <span key={area} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
                            {area}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Expertise tags */}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map((tag: string) => (
                          <span key={tag} className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full border font-medium",
                            isTop
                              ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          )}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Impact */}
                    {match.estimated_impact && (
                      <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <TrendingUp className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-green-400">{match.estimated_impact}</span>
                      </div>
                    )}

                    {/* Investor ticket size */}
                    {match.investor_id && (match.ticket_size_min || match.ticket_size_max) && (
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="text-muted-foreground">Ticket:</span>
                        <span className="font-medium text-emerald-400">
                          ${(match.ticket_size_min / 1000).toFixed(0)}k – ${(match.ticket_size_max / 1000).toFixed(0)}k
                        </span>
                        {match.stage_fit && (
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-full border text-[10px] font-medium",
                            match.stage_fit === "perfect" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : match.stage_fit === "good" ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                          )}>
                            {match.stage_fit} stage fit
                          </span>
                        )}
                      </div>
                    )}

                    {/* CTA */}
                    <div className="mt-auto pt-2 border-t border-white/8">
                      <Button
                        size="sm"
                        className={cn(
                          "w-full gap-2 text-xs",
                          isCreated && "bg-green-600/20 text-green-400 border border-green-500/20 hover:bg-green-600/20"
                        )}
                        variant={isCreated ? "outline" : "default"}
                        onClick={() => !isCreated && handleCreateRelationship(match)}
                        disabled={isCreating || isCreated}
                      >
                        {isCreating ? (
                          <div className="w-3 h-3 rounded-full border border-current/30 border-t-current animate-spin" />
                        ) : isCreated ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <GitBranch className="w-3.5 h-3.5" />
                        )}
                        {isCreated ? "Relationship Created" : isCreating ? "Creating…" : "Create Relationship"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && matches.length === 0 && selectedId && (
        <div className="text-center py-20">
          <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
          <p className="text-muted-foreground mb-2">No matches generated yet</p>
          <p className="text-xs text-muted-foreground mb-4">
            {mode === "mentor" ? "No available mentors with capacity found" : mode === "programme" ? "No open programmes found" : "No active investors found"}
          </p>
          <Button onClick={runMatch} className="gap-2">
            <Sparkles className="w-4 h-4" /> Run AI Matching
          </Button>
        </div>
      )}

      {/* Bottom hint */}
      {!loading && matches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-4 rounded-xl border border-white/8 bg-white/[0.02] flex items-center justify-between gap-4 flex-wrap"
        >
          <div>
            <p className="text-sm font-medium">Not the right fit?</p>
            <p className="text-xs text-muted-foreground mt-0.5">Switch startup or mode above, or regenerate for a fresh scoring pass.</p>
          </div>
          <Button variant="outline" size="sm" onClick={runMatch} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Regenerate
          </Button>
        </motion.div>
      )}
    </DashboardLayout>
  );
}
