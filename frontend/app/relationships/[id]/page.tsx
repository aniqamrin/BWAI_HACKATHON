"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  GitBranch, Brain, Activity, ArrowLeft, CheckCircle2, Clock, Circle,
  MessageSquare, Calendar, Zap, TrendingUp, BarChart3, Shield, AlertTriangle,
  ChevronRight, RefreshCw, ClipboardList,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { relationshipsApi } from "@/lib/api";
import { toast } from "@/components/ui/toaster";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";

const healthColors: Record<string, string> = {
  excellent: "bg-green-500/20 text-green-400 border-green-500/30",
  good: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  fair: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  poor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  inactive: "bg-red-500/20 text-red-400 border-red-500/30",
  new: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const typeLabels: Record<string, string> = {
  mentor_startup: "Mentorship",
  startup_programme: "Programme",
  startup_investor: "Investment",
  mentor_programme: "Mentor-Programme",
  partner_startup: "Partnership",
};

const typeColors: Record<string, string> = {
  mentor_startup: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  startup_programme: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  startup_investor: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  mentor_programme: "text-green-400 bg-green-500/10 border-green-500/20",
  partner_startup: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
};

const eventIcons: Record<string, { icon: any; color: string; label: string }> = {
  health_check: { icon: Activity, color: "text-blue-400", label: "Health Check" },
  nudge_sent: { icon: MessageSquare, color: "text-yellow-400", label: "Inactivity Nudge" },
  milestone_due: { icon: Clock, color: "text-orange-400", label: "Milestone Due" },
  escalation: { icon: AlertTriangle, color: "text-red-400", label: "Escalation" },
  log_added: { icon: ClipboardList, color: "text-green-400", label: "Engagement Logged" },
  status_changed: { icon: Shield, color: "text-violet-400", label: "Status Changed" },
  relationship_created: { icon: GitBranch, color: "text-violet-400", label: "Relationship Created" },
  milestone_completed: { icon: CheckCircle2, color: "text-green-400", label: "Milestone Completed" },
};

function SignalBar({ label, value, max, unit, higherIsBetter = true, color = "violet" }: {
  label: string; value: number; max: number; unit?: string; higherIsBetter?: boolean; color?: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const colorMap: Record<string, string> = {
    violet: "from-violet-600 to-blue-500",
    green: "from-green-600 to-emerald-500",
    yellow: "from-yellow-600 to-amber-500",
    red: "from-red-600 to-orange-500",
    blue: "from-blue-600 to-cyan-500",
  };
  const barClass = colorMap[color] || colorMap.violet;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">
          {typeof value === "number" ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}
          {unit && <span className="text-muted-foreground ml-0.5">{unit}</span>}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${barClass}`}
        />
      </div>
    </div>
  );
}

type TabId = "overview" | "milestones" | "timeline";

export default function RelationshipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [rel, setRel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("overview");
  const [analyzingHealth, setAnalyzingHealth] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await relationshipsApi.getById(id) as any;
      setRel(res.data);
    } catch {
      toast({ title: "Failed to load relationship", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleAnalyzeHealth = async () => {
    setAnalyzingHealth(true);
    try {
      const res = await relationshipsApi.analyzeHealth(id) as any;
      const updated = res.data;
      setRel((prev: any) => ({ ...prev, engagement_health: updated.engagement_health, health_score: updated.health_score }));
      toast({ title: "Health analysis complete", description: `Health: ${updated.engagement_health}`, variant: "success" });
    } catch {
      toast({ title: "Analysis failed", variant: "error" });
    } finally {
      setAnalyzingHealth(false);
    }
  };

  const handleCompleteMilestone = async (milestoneId: string) => {
    setCompletingId(milestoneId);
    try {
      await relationshipsApi.completeMilestone(id, milestoneId, "Completed via dashboard");
      setRel((prev: any) => ({
        ...prev,
        milestones: prev.milestones.map((m: any) =>
          m.id === milestoneId ? { ...m, status: "completed", completed_at: new Date().toISOString() } : m
        ),
      }));
      toast({ title: "Milestone marked complete", variant: "success" });
    } catch {
      toast({ title: "Failed to complete milestone", variant: "error" });
    } finally {
      setCompletingId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!rel) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Relationship not found.</p>
          <Button variant="ghost" className="mt-4" onClick={() => router.back()}>Go back</Button>
        </div>
      </DashboardLayout>
    );
  }

  const partnerName = rel.mentor_name || rel.programme_name || rel.investor_name || "—";
  const signals = rel.behavioral_signals;
  const milestones: any[] = rel.milestones || [];
  const lifecycleEvents: any[] = rel.lifecycle_events || [];
  const completedMilestones = milestones.filter((m: any) => m.status === "completed").length;

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "milestones", label: "Milestones", count: milestones.length },
    { id: "timeline", label: "Timeline", count: lifecycleEvents.length },
  ];

  return (
    <DashboardLayout>
      {/* Back link */}
      <Link href="/relationships" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Relationships
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/30 to-blue-600/30 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
              <GitBranch className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${typeColors[rel.relationship_type]}`}>
                  {typeLabels[rel.relationship_type] || rel.relationship_type}
                </span>
                {rel.ai_generated && (
                  <span className="flex items-center gap-1 text-[10px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-full border border-violet-500/20">
                    <Brain className="w-2.5 h-2.5" /> AI Matched
                  </span>
                )}
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${healthColors[rel.engagement_health] || healthColors.new}`}>
                  {rel.engagement_health}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  rel.status === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                }`}>{rel.status}</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                {rel.startup_name} <span className="text-muted-foreground font-normal">↔</span> {partnerName}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">Created {timeAgo(rel.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
            </Button>
            <Button size="sm" onClick={handleAnalyzeHealth} disabled={analyzingHealth}>
              {analyzingHealth
                ? <div className="w-3 h-3 rounded-full border border-primary/30 border-t-primary animate-spin mr-1.5" />
                : <Activity className="w-3.5 h-3.5 mr-1.5" />
              }
              Analyze Health
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Match Score", value: `${Math.round(rel.match_score || 0)}%`, icon: TrendingUp, color: "text-violet-400" },
          { label: "Confidence", value: `${Math.round(rel.confidence_score || 0)}%`, icon: Shield, color: "text-blue-400" },
          { label: "Milestones Done", value: `${completedMilestones}/${milestones.length}`, icon: CheckCircle2, color: "text-green-400" },
          { label: "Engagement Index", value: signals ? `${signals.composite_index}` : "—", icon: BarChart3, color: "text-orange-400" },
        ].map((stat) => (
          <Card key={stat.label} glass>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl font-black gradient-text">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Behavioral Signals */}
      {signals && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <Card glass>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-400" />
                Behavioral Signals
                <span className="ml-auto text-[10px] text-muted-foreground font-normal">
                  Computed {timeAgo(signals.computed_at)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
              <SignalBar label="Response Latency" value={signals.avg_response_latency_hours} max={24} unit="hrs" higherIsBetter={false} color="blue" />
              <SignalBar label="Meeting Commitment" value={Math.round(signals.meeting_commitment_ratio * 100)} max={100} unit="%" color="green" />
              <SignalBar label="Milestone Completion" value={Math.round(signals.milestone_completion_rate * 100)} max={100} unit="%" color="violet" />
              <SignalBar label="Followthrough Rate" value={Math.round(signals.next_action_followthrough_rate * 100)} max={100} unit="%" color="violet" />
              <SignalBar label="Engagement Velocity" value={signals.engagement_velocity} max={3} color={signals.engagement_velocity >= 1 ? "green" : "yellow"} />
              <SignalBar label="Composite Index" value={signals.composite_index} max={100} color={signals.composite_index >= 75 ? "green" : signals.composite_index >= 50 ? "yellow" : "red"} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-white/8 pb-px">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium transition-all relative ${
              tab === t.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-white/8 text-muted-foreground">{t.count}</span>
            )}
            {tab === t.id && (
              <motion.div layoutId="tabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === "overview" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* AI Reasoning */}
          {rel.ai_generated && rel.ai_reasoning && (
            <Card glass>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Brain className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-violet-400 mb-1">AI Match Reasoning</p>
                    <p className="text-sm text-foreground/90 leading-relaxed italic">&ldquo;{rel.ai_reasoning}&rdquo;</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Match quality bars */}
          <Card glass>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Match Quality</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Match Score</span>
                  <span className="font-semibold">{Math.round(rel.match_score || 0)}%</span>
                </div>
                <Progress value={rel.match_score || 0} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Confidence Score</span>
                  <span className="font-semibold">{Math.round(rel.confidence_score || 0)}%</span>
                </div>
                <Progress value={rel.confidence_score || 0} className="h-2" indicatorClassName="from-blue-600 to-cyan-500" />
              </div>
            </CardContent>
          </Card>

          {/* Key details */}
          <Card glass>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Relationship Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-3">
                {[
                  { label: "Type", value: typeLabels[rel.relationship_type] || rel.relationship_type },
                  { label: "Status", value: rel.status },
                  { label: "Created", value: new Date(rel.created_at).toLocaleDateString() },
                  { label: "AI Generated", value: rel.ai_generated ? "Yes" : "No" },
                  { label: "Blueprint", value: rel.blueprint_name || "None" },
                  { label: "Cohort", value: rel.cohort_id || "None" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground mb-0.5">{label}</dt>
                    <dd className="text-sm font-medium capitalize">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tab: Milestones */}
      {tab === "milestones" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {milestones.length === 0 && (
            <div className="text-center py-16">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground text-sm">No milestones defined for this relationship.</p>
            </div>
          )}
          {milestones.map((m: any, i: number) => {
            const isCompleted = m.status === "completed";
            const isOverdue = !isCompleted && new Date(m.due_at) < new Date();
            return (
              <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Card glass className={isCompleted ? "border-green-500/20" : isOverdue ? "border-red-500/20" : ""}>
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className={`mt-0.5 flex-shrink-0 ${isCompleted ? "text-green-400" : isOverdue ? "text-red-400" : "text-muted-foreground"}`}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : isOverdue ? <AlertTriangle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{m.title}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            Due {new Date(m.due_at).toLocaleDateString()}
                            {isCompleted && m.completed_at && (
                              <span className="text-green-400 ml-2">✓ Completed {new Date(m.completed_at).toLocaleDateString()}</span>
                            )}
                            {isOverdue && <span className="text-red-400 ml-2">Overdue</span>}
                          </p>
                        </div>
                        {!isCompleted && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs flex-shrink-0"
                            onClick={() => handleCompleteMilestone(m.id)}
                            disabled={completingId === m.id}
                          >
                            {completingId === m.id
                              ? <div className="w-3 h-3 rounded-full border border-primary/30 border-t-primary animate-spin" />
                              : "Mark Done"
                            }
                          </Button>
                        )}
                      </div>
                      {m.notes && (
                        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-white/5 italic">{m.notes}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Tab: Timeline */}
      {tab === "timeline" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {lifecycleEvents.length === 0 && (
            <div className="text-center py-16">
              <Clock className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground text-sm">No timeline events yet.</p>
            </div>
          )}
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-white/8" />
            <div className="space-y-0">
              {lifecycleEvents.map((event: any, i: number) => {
                const cfg = eventIcons[event.event_type] || { icon: ChevronRight, color: "text-muted-foreground", label: event.event_type };
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="relative flex gap-4 pb-6 pl-12"
                  >
                    <div className={`absolute left-3 w-4 h-4 rounded-full bg-card border border-white/10 flex items-center justify-center top-0.5`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${cfg.color.replace("text-", "bg-")}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${cfg.color} flex-shrink-0`} />
                          <p className="text-sm font-medium">{cfg.label}</p>
                          <span className="text-[10px] text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded-full">
                            via {event.triggered_by}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground flex-shrink-0">{timeAgo(event.created_at)}</p>
                      </div>
                      {event.payload && (
                        <div className="mt-1.5 text-xs text-muted-foreground ml-5.5">
                          {event.payload.message && <p>{event.payload.message}</p>}
                          {event.payload.health_score !== undefined && (
                            <p>Health score: <span className="text-foreground font-medium">{event.payload.health_score}</span></p>
                          )}
                          {event.payload.days_inactive !== undefined && (
                            <p>Inactive for <span className="text-yellow-400 font-medium">{event.payload.days_inactive} days</span></p>
                          )}
                          {event.payload.milestone_title && (
                            <p>Milestone: <span className="text-orange-400 font-medium">{event.payload.milestone_title}</span></p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </DashboardLayout>
  );
}
