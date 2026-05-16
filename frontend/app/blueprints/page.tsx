"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookTemplate, Plus, Clock, Users, Activity, Star,
  ChevronRight, CheckCircle, AlertTriangle, Zap, Shield
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { blueprintsApi } from "@/lib/api";
import { toast } from "@/components/ui/toaster";

const typeColors: Record<string, string> = {
  mentor_startup: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  startup_programme: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  startup_investor: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  partner_startup: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
};

const typeLabels: Record<string, string> = {
  mentor_startup: "Mentorship",
  startup_programme: "Programme",
  startup_investor: "Investment",
  partner_startup: "Partnership",
};

const defaultForm = {
  name: "", description: "", relationship_type: "mentor_startup",
  duration_weeks: 12, required_checkins_per_month: 2,
  milestone_week_schedule: "4,8,12",
  health_alert_threshold: 60, escalation_threshold: 40, inactivity_alert_days: 7,
};

export default function BlueprintsPage() {
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    blueprintsApi.getAll().then((res: any) => {
      setBlueprints(res.data?.blueprints || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.name) return toast({ title: "Name is required", variant: "error" });
    setSaving(true);
    try {
      const milestoneSchedule = form.milestone_week_schedule
        .split(",").map(s => parseInt(s.trim())).filter(Boolean);
      const res = await blueprintsApi.create({ ...form, milestone_week_schedule: milestoneSchedule }) as any;
      setBlueprints(prev => [res.data, ...prev]);
      setShowForm(false);
      setForm(defaultForm);
      toast({ title: "Blueprint created!", variant: "success" });
    } catch (err) {
      toast({ title: "Failed to create blueprint", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Relationship Blueprints"
        description="Reusable, programmable relationship templates with automated lifecycle rules"
        icon={BookTemplate}
        badge={`${blueprints.length} blueprints`}
        action={
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" /> New Blueprint
          </Button>
        }
      />

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <Card glass>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4 text-violet-400" /> New Relationship Blueprint
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">Blueprint Name *</label>
                    <input
                      className="w-full glass-input rounded-lg px-3 py-2 text-sm bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary/50"
                      placeholder="e.g. 3-Month Growth Mentorship"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                    <textarea
                      className="w-full glass-input rounded-lg px-3 py-2 text-sm bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary/50 resize-none"
                      rows={2}
                      placeholder="Describe the purpose and structure of this blueprint"
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Relationship Type</label>
                    <select
                      className="w-full rounded-lg px-3 py-2 text-sm bg-background border border-white/10 text-foreground focus:outline-none"
                      value={form.relationship_type}
                      onChange={e => setForm({ ...form, relationship_type: e.target.value })}
                    >
                      <option value="mentor_startup">Mentorship</option>
                      <option value="startup_programme">Programme Enrolment</option>
                      <option value="startup_investor">Investment</option>
                      <option value="partner_startup">Partnership</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Duration (weeks)</label>
                    <input
                      type="number" min={1} max={52}
                      className="w-full rounded-lg px-3 py-2 text-sm bg-white/5 border border-white/10 text-foreground focus:outline-none"
                      value={form.duration_weeks}
                      onChange={e => setForm({ ...form, duration_weeks: parseInt(e.target.value) || 12 })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Check-ins / month</label>
                    <input
                      type="number" min={1} max={8}
                      className="w-full rounded-lg px-3 py-2 text-sm bg-white/5 border border-white/10 text-foreground focus:outline-none"
                      value={form.required_checkins_per_month}
                      onChange={e => setForm({ ...form, required_checkins_per_month: parseInt(e.target.value) || 2 })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Milestone weeks (comma-separated)</label>
                    <input
                      className="w-full rounded-lg px-3 py-2 text-sm bg-white/5 border border-white/10 text-foreground focus:outline-none"
                      placeholder="e.g. 4,8,12"
                      value={form.milestone_week_schedule}
                      onChange={e => setForm({ ...form, milestone_week_schedule: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Health alert threshold</label>
                    <input
                      type="number" min={0} max={100}
                      className="w-full rounded-lg px-3 py-2 text-sm bg-white/5 border border-white/10 text-foreground focus:outline-none"
                      value={form.health_alert_threshold}
                      onChange={e => setForm({ ...form, health_alert_threshold: parseInt(e.target.value) || 60 })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Escalation threshold</label>
                    <input
                      type="number" min={0} max={100}
                      className="w-full rounded-lg px-3 py-2 text-sm bg-white/5 border border-white/10 text-foreground focus:outline-none"
                      value={form.escalation_threshold}
                      onChange={e => setForm({ ...form, escalation_threshold: parseInt(e.target.value) || 40 })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Inactivity alert (days)</label>
                    <input
                      type="number" min={1} max={30}
                      className="w-full rounded-lg px-3 py-2 text-sm bg-white/5 border border-white/10 text-foreground focus:outline-none"
                      value={form.inactivity_alert_days}
                      onChange={e => setForm({ ...form, inactivity_alert_days: parseInt(e.target.value) || 7 })}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2 border-t border-white/8">
                  <Button onClick={handleCreate} disabled={saving} className="gap-2">
                    {saving ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Create Blueprint
                  </Button>
                  <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blueprint Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-64 rounded-xl shimmer" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {blueprints.map((bp, i) => (
            <motion.div
              key={bp.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card glass className="h-full hover:border-white/20 transition-all group">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                      <BookTemplate className="w-5 h-5 text-violet-400" />
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${typeColors[bp.relationship_type]}`}>
                      {typeLabels[bp.relationship_type]}
                    </span>
                  </div>

                  <h3 className="font-semibold text-sm mb-1">{bp.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed flex-1">{bp.description}</p>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 rounded-lg bg-white/5">
                      <p className="text-sm font-bold">{bp.duration_weeks}w</p>
                      <p className="text-[9px] text-muted-foreground">Duration</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-white/5">
                      <p className="text-sm font-bold">{bp.required_checkins_per_month}×</p>
                      <p className="text-[9px] text-muted-foreground">Monthly</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-white/5">
                      <p className="text-sm font-bold">{bp.milestone_week_schedule?.length || 3}</p>
                      <p className="text-[9px] text-muted-foreground">Milestones</p>
                    </div>
                  </div>

                  {/* Rules summary */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-xs">
                      <AlertTriangle className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                      <span className="text-muted-foreground">Alert at health &lt; <span className="text-foreground font-medium">{bp.health_alert_threshold}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Zap className="w-3 h-3 text-orange-400 flex-shrink-0" />
                      <span className="text-muted-foreground">Escalate at health &lt; <span className="text-foreground font-medium">{bp.escalation_threshold}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="w-3 h-3 text-blue-400 flex-shrink-0" />
                      <span className="text-muted-foreground">Nudge after <span className="text-foreground font-medium">{bp.inactivity_alert_days}d</span> inactivity</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/8">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span>{bp.usage_count || 0} uses</span>
                      </div>
                      {bp.avg_outcome_rating && (
                        <div className="flex items-center gap-1 text-xs text-yellow-400">
                          <Star className="w-3 h-3 fill-yellow-400" />
                          <span>{parseFloat(bp.avg_outcome_rating).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {blueprints.length === 0 && !loading && (
        <div className="text-center py-20">
          <BookTemplate className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
          <p className="text-muted-foreground mb-2">No blueprints yet</p>
          <p className="text-xs text-muted-foreground">Create your first relationship blueprint to define automated lifecycle rules</p>
          <Button className="mt-4 gap-2" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> Create Blueprint
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
}
