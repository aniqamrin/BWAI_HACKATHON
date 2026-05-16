"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, GitBranch, BookTemplate, CheckCircle, Clock, Zap } from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cohortsApi, programmesApi, blueprintsApi } from "@/lib/api";
import { toast } from "@/components/ui/toaster";
import { timeAgo } from "@/lib/utils";

const statusColors: Record<string, string> = {
  draft: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  matching: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  active: "bg-green-500/15 text-green-400 border-green-500/30",
  completed: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

const defaultForm = { name: "", country: "", description: "", programme_id: "", blueprint_id: "" };

export default function CohortsPage() {
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([cohortsApi.getAll(), programmesApi.getAll(), blueprintsApi.getAll()])
      .then(([cohRes, progRes, bpRes]: any[]) => {
        setCohorts(cohRes.data?.cohorts || []);
        setProgrammes(progRes.data?.programmes || []);
        setBlueprints(bpRes.data?.blueprints || []);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.name) return toast({ title: "Name is required", variant: "error" });
    setSaving(true);
    try {
      const res = await cohortsApi.create(form) as any;
      setCohorts(prev => [res.data, ...prev]);
      setShowForm(false);
      setForm(defaultForm);
      toast({ title: "Cohort created!", variant: "success" });
    } catch {
      toast({ title: "Failed to create cohort", variant: "error" });
    } finally { setSaving(false); }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Cohort Management"
        description="Batch-match startups and mentors across programmes with AI-optimized assignments"
        icon={Users}
        badge={`${cohorts.length} cohorts`}
        action={
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" /> New Cohort
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Cohorts", value: cohorts.length },
          { label: "Active", value: cohorts.filter(c => c.status === "active").length },
          { label: "In Matching", value: cohorts.filter(c => c.status === "matching").length },
          { label: "Total Relationships", value: cohorts.reduce((a, c) => a + (parseInt(c.relationship_count) || 0), 0) },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card glass><CardContent className="p-4 text-center">
              <p className="text-2xl font-black gradient-text">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
            <Card glass>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-violet-400" /> New Cohort
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Cohort Name *</label>
                    <input className="w-full rounded-lg px-3 py-2 text-sm bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary/50"
                      placeholder="e.g. West Africa FinTech 2024 Q2" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Country</label>
                    <input className="w-full rounded-lg px-3 py-2 text-sm bg-white/5 border border-white/10 text-foreground focus:outline-none"
                      placeholder="e.g. Ghana" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Programme (optional)</label>
                    <select className="w-full rounded-lg px-3 py-2 text-sm bg-background border border-white/10 text-foreground focus:outline-none"
                      value={form.programme_id} onChange={e => setForm({ ...form, programme_id: e.target.value })}>
                      <option value="">None</option>
                      {programmes.map((p: any) => <option key={p.id} value={p.id}>{p.programme_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Blueprint (optional)</label>
                    <select className="w-full rounded-lg px-3 py-2 text-sm bg-background border border-white/10 text-foreground focus:outline-none"
                      value={form.blueprint_id} onChange={e => setForm({ ...form, blueprint_id: e.target.value })}>
                      <option value="">None</option>
                      {blueprints.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                    <textarea className="w-full rounded-lg px-3 py-2 text-sm bg-white/5 border border-white/10 text-foreground focus:outline-none resize-none" rows={2}
                      placeholder="Cohort focus and goals" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-3 pt-2 border-t border-white/8">
                  <Button onClick={handleCreate} disabled={saving} className="gap-2">
                    {saving ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Create Cohort
                  </Button>
                  <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cohort list */}
      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-36 rounded-xl shimmer" />)}</div>
      ) : (
        <div className="space-y-4">
          {cohorts.map((cohort, i) => (
            <motion.div key={cohort.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Link href={`/cohorts/${cohort.id}`}>
                <Card glass className="hover:border-white/20 transition-all cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{cohort.name}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColors[cohort.status]}`}>{cohort.status}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {cohort.programme_name || "No programme"} · {cohort.country || "Global"}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">{timeAgo(cohort.created_at)}</div>
                    </div>

                    <div className="flex items-center gap-6 mb-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Users className="w-3.5 h-3.5 text-violet-400" />
                        <span>{cohort.startup_count || 0} startups</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Users className="w-3.5 h-3.5 text-green-400" />
                        <span>{cohort.mentor_count || 0} mentors</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <GitBranch className="w-3.5 h-3.5 text-blue-400" />
                        <span>{cohort.relationship_count || 0} relationships</span>
                      </div>
                      {cohort.blueprint_name && (
                        <div className="flex items-center gap-1.5 text-xs text-violet-400">
                          <BookTemplate className="w-3.5 h-3.5" />
                          <span>{cohort.blueprint_name}</span>
                        </div>
                      )}
                    </div>

                    {cohort.status === "draft" && (cohort.startup_count || 0) > 0 && (cohort.mentor_count || 0) > 0 && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <Zap className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                        <p className="text-xs text-yellow-400">Ready for AI matching — open cohort to run the compatibility matrix</p>
                      </div>
                    )}
                    {cohort.status === "active" && cohort.approved_at && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                        <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                        <p className="text-xs text-green-400">Approved {timeAgo(cohort.approved_at)} · {cohort.relationship_count} active relationships</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
          {cohorts.length === 0 && (
            <div className="text-center py-20">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground mb-2">No cohorts yet</p>
              <Button className="mt-3 gap-2" onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Create Cohort</Button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
