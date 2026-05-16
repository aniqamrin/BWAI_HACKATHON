"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Zap, CheckCircle, AlertTriangle, Brain, ArrowRight, GitBranch } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cohortsApi } from "@/lib/api";
import { toast } from "@/components/ui/toaster";

const scoreColor = (score: number) => {
  if (score >= 85) return "bg-green-500";
  if (score >= 70) return "bg-blue-500";
  if (score >= 55) return "bg-yellow-500";
  return "bg-red-500";
};

const scoreBg = (score: number) => {
  if (score >= 85) return "bg-green-500/20 text-green-400 border border-green-500/30";
  if (score >= 70) return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
  if (score >= 55) return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
  return "bg-red-500/20 text-red-400 border border-red-500/30";
};

export default function CohortDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [cohort, setCohort] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    cohortsApi.getById(id).then((res: any) => {
      setCohort(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const handleRunMatching = async () => {
    setRunning(true);
    try {
      const res = await cohortsApi.runMatching(id) as any;
      setCohort((prev: any) => ({ ...prev, status: "matching", match_matrix: res.data }));
      toast({ title: "AI matching complete!", description: "Review the compatibility matrix below", variant: "success" });
    } catch {
      toast({ title: "Matching failed", variant: "error" });
    } finally { setRunning(false); }
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      const res = await cohortsApi.approve(id) as any;
      setCohort((prev: any) => ({ ...prev, status: "active", approved_at: new Date().toISOString() }));
      toast({ title: `${res.data?.created_count} relationships created!`, variant: "success" });
    } catch {
      toast({ title: "Approval failed", variant: "error" });
    } finally { setApproving(false); }
  };

  if (loading) return <DashboardLayout><div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-xl shimmer" />)}</div></DashboardLayout>;
  if (!cohort) return <DashboardLayout><p className="text-muted-foreground">Cohort not found</p></DashboardLayout>;

  const matrix = cohort.match_matrix;
  const hasMatrix = matrix && matrix.scores && Object.keys(matrix.scores).length > 0;
  const optimalAssignment = matrix?.optimal_assignment || {};
  const startups: any[] = matrix?.startups || cohort.startups || [];
  const mentors: any[] = matrix?.mentors || cohort.mentors || [];

  return (
    <DashboardLayout>
      <PageHeader
        title={cohort.name}
        description={`${cohort.programme_name || "No programme"} · ${cohort.country || "Global"}`}
        icon={Users}
        badge={cohort.status}
      />

      {/* Status bar */}
      <div className="flex items-center gap-4 mb-6 p-4 rounded-xl border border-white/10 bg-white/3">
        {[
          { step: 1, label: "Created", done: true },
          { step: 2, label: "Members Added", done: (cohort.startup_ids?.length || 0) > 0 },
          { step: 3, label: "AI Matching", done: hasMatrix },
          { step: 4, label: "Approved", done: cohort.status === "active" || cohort.status === "completed" },
        ].map((s, i) => (
          <div key={s.step} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${s.done ? "bg-green-500 text-white" : "bg-white/10 text-muted-foreground"}`}>
              {s.done ? <CheckCircle className="w-3.5 h-3.5" /> : s.step}
            </div>
            <span className={`text-xs font-medium ${s.done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
            {i < 3 && <ArrowRight className="w-3 h-3 text-muted-foreground mx-1" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Member lists */}
        <div className="space-y-4">
          <Card glass>
            <CardHeader><CardTitle className="text-xs">Startups ({startups.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {startups.map((s: any) => (
                <div key={s.id} className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">
                  <div className="w-6 h-6 rounded bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-400">
                    {s.name?.charAt(0) || s.startup_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-medium">{s.name || s.startup_name}</p>
                    <p className="text-[10px] text-muted-foreground">{s.industry} · {s.stage}</p>
                  </div>
                </div>
              ))}
              {startups.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">No startups added</p>}
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader><CardTitle className="text-xs">Mentors ({mentors.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {mentors.map((m: any) => (
                <div key={m.id} className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">
                  <div className="w-6 h-6 rounded bg-green-500/20 flex items-center justify-center text-[10px] font-bold text-green-400">
                    {m.name?.charAt(0) || m.full_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-medium">{m.name || m.full_name}</p>
                    <p className="text-[10px] text-muted-foreground">{(m.expertise || []).slice(0, 2).join(", ")}</p>
                  </div>
                </div>
              ))}
              {mentors.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">No mentors added</p>}
            </CardContent>
          </Card>
        </div>

        {/* Center: Compatibility matrix */}
        <div className="col-span-2">
          <Card glass>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="w-4 h-4 text-violet-400" />
                  {hasMatrix ? "AI Compatibility Matrix" : "Run AI Matching"}
                </CardTitle>
                {cohort.status !== "active" && cohort.status !== "completed" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleRunMatching} disabled={running || startups.length === 0 || mentors.length === 0} className="gap-1.5 h-7 text-xs">
                      {running ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="w-3 h-3" />}
                      {running ? "Running..." : "Run Matching"}
                    </Button>
                    {hasMatrix && (
                      <Button size="sm" onClick={handleApprove} disabled={approving} className="gap-1.5 h-7 text-xs bg-green-600 hover:bg-green-700">
                        {approving ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                        Approve & Create
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!hasMatrix ? (
                <div className="text-center py-16">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                  <p className="text-sm text-muted-foreground mb-2">No compatibility matrix yet</p>
                  <p className="text-xs text-muted-foreground">Add startups and mentors, then run AI matching to generate the N×M compatibility grid</p>
                </div>
              ) : (
                <>
                  {/* Matrix grid */}
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          <th className="text-left p-2 text-muted-foreground font-medium">Startup</th>
                          {mentors.map((m: any) => (
                            <th key={m.id} className="p-2 text-center text-muted-foreground font-medium min-w-[100px]">
                              {(m.name || m.full_name || "").split(" ")[0]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {startups.map((s: any) => (
                          <tr key={s.id} className="border-t border-white/5">
                            <td className="p-2 font-medium text-xs">{s.name || s.startup_name}</td>
                            {mentors.map((m: any) => {
                              const cell = matrix.scores?.[s.id]?.[m.id];
                              const score = cell?.score || 0;
                              const isOptimal = optimalAssignment[s.id]?.mentor_id === m.id;
                              return (
                                <td key={m.id} className="p-2 text-center">
                                  <div className={`inline-flex items-center justify-center w-12 h-8 rounded-lg font-bold text-sm ${scoreBg(score)} ${isOptimal ? "ring-2 ring-violet-500/50" : ""}`}>
                                    {score}
                                    {isOptimal && <span className="ml-1 text-[8px]">★</span>}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Optimal assignment */}
                  <div className="border-t border-white/8 pt-4">
                    <h4 className="text-xs font-semibold text-violet-400 mb-3 flex items-center gap-1.5">
                      <Zap className="w-3 h-3" /> Optimal Assignment (★ highlighted in matrix)
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(optimalAssignment).map(([startupId, assignment]: any) => {
                        const startup = startups.find(s => s.id === startupId);
                        const mentor = mentors.find(m => m.id === assignment.mentor_id);
                        return (
                          <div key={startupId} className="flex items-center gap-3 p-2 rounded-lg bg-violet-500/8 border border-violet-500/15">
                            <div className="flex-1 flex items-center gap-2">
                              <span className="text-xs font-medium">{startup?.name || startup?.startup_name || startupId}</span>
                              <ArrowRight className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-green-400 font-medium">{mentor?.name || mentor?.full_name || assignment.mentor_id}</span>
                            </div>
                            <div className={`px-2 py-0.5 rounded text-xs font-bold ${scoreBg(assignment.score)}`}>{assignment.score}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Relationships created */}
          {cohort.relationships?.length > 0 && (
            <Card glass className="mt-4">
              <CardHeader><CardTitle className="text-xs flex items-center gap-2"><GitBranch className="w-3.5 h-3.5 text-blue-400" /> Created Relationships ({cohort.relationships.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {cohort.relationships.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                    <span className="text-xs">{r.startup_name}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={r.match_score} className="w-16 h-1" />
                      <span className="text-xs font-bold text-primary">{Math.round(r.match_score)}%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
