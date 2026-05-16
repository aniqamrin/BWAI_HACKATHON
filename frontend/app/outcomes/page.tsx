"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Plus, Star, TrendingUp, Brain, CheckCircle, BarChart3 } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { outcomesApi, relationshipsApi } from "@/lib/api";
import { toast } from "@/components/ui/toaster";
import { timeAgo } from "@/lib/utils";

const successColors: Record<string, string> = {
  high: "bg-green-500/15 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  low: "bg-red-500/15 text-red-400 border-red-500/30",
};

const defaultForm = {
  relationship_id: "", funding_raised_after: "", milestone_completion_rate: "",
  mentor_nps: "", programme_graduation: false, overall_rating: "4",
  key_wins: "", key_challenges: "",
};

export default function OutcomesPage() {
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"outcomes" | "insights" | "capture">("outcomes");
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      outcomesApi.getAll(),
      outcomesApi.getInsights(),
      relationshipsApi.getAll({ status: "completed" }),
    ]).then(([outRes, insRes, relRes]: any[]) => {
      setOutcomes(outRes.data?.outcomes || []);
      setInsights(insRes.data);
      setRelationships(relRes.data?.relationships || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleCapture = async () => {
    if (!form.relationship_id || !form.overall_rating) {
      return toast({ title: "Relationship and rating are required", variant: "error" });
    }
    setSaving(true);
    try {
      const wins = form.key_wins.split(",").map(s => s.trim()).filter(Boolean);
      const challenges = form.key_challenges.split(",").map(s => s.trim()).filter(Boolean);
      const res = await outcomesApi.capture({
        relationship_id: form.relationship_id,
        funding_raised_after: parseFloat(form.funding_raised_after) || 0,
        milestone_completion_rate: parseFloat(form.milestone_completion_rate) / 100 || 0,
        mentor_nps: form.mentor_nps ? parseInt(form.mentor_nps) : null,
        programme_graduation: form.programme_graduation,
        overall_rating: parseInt(form.overall_rating),
        key_wins: wins, key_challenges: challenges,
      }) as any;
      setOutcomes(prev => [res.data, ...prev]);
      setForm(defaultForm);
      setActiveTab("outcomes");
      toast({ title: "Outcome captured! AI analysis complete.", variant: "success" });
    } catch {
      toast({ title: "Failed to capture outcome", variant: "error" });
    } finally { setSaving(false); }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Outcome Intelligence"
        description="Capture relationship outcomes and build a learning system that improves future matching"
        icon={Trophy}
        badge={`${outcomes.length} outcomes`}
        action={
          <Button onClick={() => setActiveTab("capture")} className="gap-2">
            <Plus className="w-4 h-4" /> Capture Outcome
          </Button>
        }
      />

      {/* Summary stats */}
      {insights && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Outcomes", value: insights.total_outcomes, icon: Trophy },
            { label: "Avg Rating", value: `${insights.avg_rating}/5`, icon: Star },
            { label: "High Success Rate", value: `${insights.high_success_rate}%`, icon: TrendingUp },
            { label: "Top Industry", value: insights.top_industries?.[0]?.industry || "N/A", icon: BarChart3 },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card glass><CardContent className="p-4 flex items-center gap-3">
                <s.icon className="w-5 h-5 text-violet-400 flex-shrink-0" />
                <div>
                  <p className="text-lg font-black gradient-text">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent></Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: "outcomes", label: `Outcomes (${outcomes.length})` },
          { id: "insights", label: "AI Insights" },
          { id: "capture", label: "+ Capture New" },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === t.id ? "bg-primary/20 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-48 rounded-xl shimmer" />)}</div>
      ) : activeTab === "outcomes" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {outcomes.map((out, i) => (
            <motion.div key={out.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card glass className="h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-sm">{out.startup_name}</h3>
                      <p className="text-xs text-muted-foreground">{out.mentor_name || "Programme"} · {out.relationship_type?.replace("_", " ↔ ")}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${successColors[out.success_classification || "medium"]}`}>
                      {out.success_classification || "medium"} success
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center p-2 rounded-lg bg-white/5">
                      <p className="text-sm font-bold text-green-400">${(out.funding_raised_after || 0).toLocaleString()}</p>
                      <p className="text-[9px] text-muted-foreground">Funding</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-white/5">
                      <p className="text-sm font-bold">{Math.round((out.milestone_completion_rate || 0) * 100)}%</p>
                      <p className="text-[9px] text-muted-foreground">Milestones</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-white/5">
                      <div className="flex items-center justify-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} className={`w-2.5 h-2.5 ${n <= (out.overall_rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                        ))}
                      </div>
                      <p className="text-[9px] text-muted-foreground">Rating</p>
                    </div>
                  </div>

                  {out.key_wins?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[10px] font-semibold text-green-400 mb-1">Key Wins</p>
                      <div className="flex flex-wrap gap-1">
                        {out.key_wins.slice(0, 3).map((w: string, i: number) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">{w}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {out.ai_summary && (
                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-white/5 italic leading-relaxed">
                      "{out.ai_summary}"
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {outcomes.length === 0 && (
            <div className="col-span-2 text-center py-16">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">No outcomes captured yet</p>
              <Button className="mt-3 gap-2" onClick={() => setActiveTab("capture")}><Plus className="w-4 h-4" /> Capture First Outcome</Button>
            </div>
          )}
        </div>
      ) : activeTab === "insights" ? (
        <div className="space-y-6">
          {insights?.ai_insights?.headline && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="p-4 rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-600/10 to-blue-600/10 flex items-center gap-3">
                <Brain className="w-5 h-5 text-violet-400 flex-shrink-0" />
                <p className="text-sm font-medium">{insights.ai_insights.headline}</p>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <Card glass>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Brain className="w-4 h-4 text-violet-400" /> Key Insights</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {(insights?.ai_insights?.key_insights || []).map((insight: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-violet-400">{i + 1}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{insight}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card glass>
              <CardHeader><CardTitle className="text-sm">Top Industries by Outcome</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {(insights?.top_industries || []).map((ind: any, i: number) => (
                  <div key={ind.industry}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{ind.industry}</span>
                      <span className="text-muted-foreground">{ind.count} outcomes · {ind.avg_rating}/5</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(ind.avg_rating / 5) * 100}%` }} transition={{ delay: i * 0.1, duration: 0.8 }}
                        className="h-full rounded-full bg-gradient-to-r from-violet-600 to-blue-500" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card glass>
              <CardHeader><CardTitle className="text-sm">Patterns Identified</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(insights?.ai_insights?.patterns || []).map((p: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <TrendingUp className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">{p}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card glass>
              <CardHeader><CardTitle className="text-sm">Recommendations</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(insights?.ai_insights?.recommendations || []).map((r: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">{r}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Capture form */
        <Card glass className="max-w-2xl">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-400" /> Capture Relationship Outcome</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Relationship *</label>
                <select className="w-full rounded-lg px-3 py-2 text-sm bg-background border border-white/10 text-foreground focus:outline-none"
                  value={form.relationship_id} onChange={e => setForm({ ...form, relationship_id: e.target.value })}>
                  <option value="">Select a completed relationship</option>
                  {relationships.map((r: any) => (
                    <option key={r.id} value={r.id}>{r.startup_name} ↔ {r.mentor_name || r.programme_name || "Partner"}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Funding Raised After ($)</label>
                  <input type="number" className="w-full rounded-lg px-3 py-2 text-sm bg-white/5 border border-white/10 text-foreground focus:outline-none"
                    placeholder="0" value={form.funding_raised_after} onChange={e => setForm({ ...form, funding_raised_after: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Milestone Completion (%)</label>
                  <input type="number" min={0} max={100} className="w-full rounded-lg px-3 py-2 text-sm bg-white/5 border border-white/10 text-foreground focus:outline-none"
                    placeholder="0-100" value={form.milestone_completion_rate} onChange={e => setForm({ ...form, milestone_completion_rate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Mentor NPS (0-10)</label>
                  <input type="number" min={0} max={10} className="w-full rounded-lg px-3 py-2 text-sm bg-white/5 border border-white/10 text-foreground focus:outline-none"
                    placeholder="0-10" value={form.mentor_nps} onChange={e => setForm({ ...form, mentor_nps: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Overall Rating *</label>
                  <select className="w-full rounded-lg px-3 py-2 text-sm bg-background border border-white/10 text-foreground focus:outline-none"
                    value={form.overall_rating} onChange={e => setForm({ ...form, overall_rating: e.target.value })}>
                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} star{n !== 1 ? "s" : ""}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Key Wins (comma-separated)</label>
                <input className="w-full rounded-lg px-3 py-2 text-sm bg-white/5 border border-white/10 text-foreground focus:outline-none"
                  placeholder="e.g. Raised seed round, Launched in 3 markets" value={form.key_wins} onChange={e => setForm({ ...form, key_wins: e.target.value })} />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Key Challenges (comma-separated)</label>
                <input className="w-full rounded-lg px-3 py-2 text-sm bg-white/5 border border-white/10 text-foreground focus:outline-none"
                  placeholder="e.g. Regulatory hurdles, Customer acquisition cost" value={form.key_challenges} onChange={e => setForm({ ...form, key_challenges: e.target.value })} />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/8">
                <input type="checkbox" id="grad" checked={form.programme_graduation}
                  onChange={e => setForm({ ...form, programme_graduation: e.target.checked })}
                  className="rounded" />
                <label htmlFor="grad" className="text-xs text-muted-foreground cursor-pointer">Programme graduation achieved</label>
              </div>

              <div className="flex gap-3 pt-2 border-t border-white/8">
                <Button onClick={handleCapture} disabled={saving} className="gap-2">
                  {saving ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <Brain className="w-4 h-4" />}
                  {saving ? "AI Analysing..." : "Capture & Analyse"}
                </Button>
                <Button variant="ghost" onClick={() => setActiveTab("outcomes")}>Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
