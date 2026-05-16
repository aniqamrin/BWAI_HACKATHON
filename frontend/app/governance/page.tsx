"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Plus, AlertTriangle, XCircle, CheckCircle, Activity, ToggleLeft, ToggleRight } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { governanceApi } from "@/lib/api";
import { toast } from "@/components/ui/toaster";
import { timeAgo } from "@/lib/utils";

const ruleTypeColors: Record<string, string> = {
  capacity: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  eligibility: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  conflict: "bg-red-500/15 text-red-400 border-red-500/30",
  cooldown: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  quality: "bg-green-500/15 text-green-400 border-green-500/30",
};

const actionColors: Record<string, string> = {
  block: "text-red-400",
  warn: "text-yellow-400",
  flag: "text-orange-400",
};

const defaultForm = {
  name: "", description: "", rule_type: "capacity", scope: "platform",
  field: "", operator: ">=", value: "",
  action_type: "block", action_message: "",
};

export default function GovernancePage() {
  const [rules, setRules] = useState<any[]>([]);
  const [violations, setViolations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"rules" | "violations">("rules");

  useEffect(() => {
    Promise.all([
      governanceApi.getRules(),
      governanceApi.getViolations(),
    ]).then(([rulesRes, violRes]: any[]) => {
      setRules(rulesRes.data?.rules || []);
      setViolations(violRes.data?.violations || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.name || !form.field || !form.value) {
      return toast({ title: "Name, field and value are required", variant: "error" });
    }
    setSaving(true);
    try {
      const res = await governanceApi.createRule({
        name: form.name, description: form.description,
        rule_type: form.rule_type, scope: form.scope,
        condition_json: { field: form.field, operator: form.operator, value: form.value },
        action_json: { type: form.action_type, message: form.action_message || `${form.name} violated` },
      }) as any;
      setRules(prev => [res.data, ...prev]);
      setShowForm(false);
      setForm(defaultForm);
      toast({ title: "Governance rule created!", variant: "success" });
    } catch {
      toast({ title: "Failed to create rule", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (rule: any) => {
    try {
      await governanceApi.updateRule(rule.id, { is_active: !rule.is_active });
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: !r.is_active } : r));
      toast({ title: `Rule ${!rule.is_active ? "activated" : "deactivated"}`, variant: "success" });
    } catch {
      toast({ title: "Failed to update rule", variant: "error" });
    }
  };

  const activeRules = rules.filter(r => r.is_active);
  const inactiveRules = rules.filter(r => !r.is_active);

  return (
    <DashboardLayout>
      <PageHeader
        title="Governance Rules"
        description="Automated rules that govern every relationship in the ecosystem"
        icon={Shield}
        badge={`${activeRules.length} active`}
        action={
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Rule
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Rules", value: rules.length, icon: Shield, color: "text-violet-400" },
          { label: "Active Rules", value: activeRules.length, icon: CheckCircle, color: "text-green-400" },
          { label: "Total Violations", value: rules.reduce((a, r) => a + (r.violation_count || 0), 0), icon: AlertTriangle, color: "text-yellow-400" },
          { label: "Recent Violations", value: violations.length, icon: XCircle, color: "text-red-400" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card glass>
              <CardContent className="p-4 flex items-center gap-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <div>
                  <p className="text-xl font-black">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* New rule form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
            <Card glass>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4 text-violet-400" /> New Governance Rule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">Rule Name *</label>
                    <input className="w-full rounded-lg px-3 py-2 text-sm bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary/50"
                      placeholder="e.g. Mentor Capacity Cap" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Rule Type</label>
                    <select className="w-full rounded-lg px-3 py-2 text-sm bg-background border border-white/10 text-foreground focus:outline-none"
                      value={form.rule_type} onChange={e => setForm({ ...form, rule_type: e.target.value })}>
                      <option value="capacity">Capacity</option>
                      <option value="eligibility">Eligibility</option>
                      <option value="conflict">Conflict</option>
                      <option value="cooldown">Cooldown</option>
                      <option value="quality">Quality</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Action</label>
                    <select className="w-full rounded-lg px-3 py-2 text-sm bg-background border border-white/10 text-foreground focus:outline-none"
                      value={form.action_type} onChange={e => setForm({ ...form, action_type: e.target.value })}>
                      <option value="block">Block (hard stop)</option>
                      <option value="warn">Warn (soft flag)</option>
                      <option value="flag">Flag for review</option>
                    </select>
                  </div>

                  {/* Condition builder */}
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-2 block">Condition: IF</label>
                    <div className="flex items-center gap-2">
                      <input className="flex-1 rounded-lg px-3 py-2 text-sm bg-white/5 border border-white/10 text-foreground focus:outline-none"
                        placeholder="field (e.g. mentor.current_startups)" value={form.field} onChange={e => setForm({ ...form, field: e.target.value })} />
                      <select className="w-24 rounded-lg px-2 py-2 text-sm bg-background border border-white/10 text-foreground focus:outline-none"
                        value={form.operator} onChange={e => setForm({ ...form, operator: e.target.value })}>
                        <option value=">=">&gt;=</option>
                        <option value=">">&gt;</option>
                        <option value="<=">&lt;=</option>
                        <option value="<">&lt;</option>
                        <option value="==">==</option>
                        <option value="!=">!=</option>
                      </select>
                      <input className="w-32 rounded-lg px-3 py-2 text-sm bg-white/5 border border-white/10 text-foreground focus:outline-none"
                        placeholder="value" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Available fields: mentor.current_startups, mentor.max_startups, mentor.rating, startup.verification_score, startup.risk_level</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">Action Message</label>
                    <input className="w-full rounded-lg px-3 py-2 text-sm bg-white/5 border border-white/10 text-foreground focus:outline-none"
                      placeholder="Message shown when rule is triggered" value={form.action_message} onChange={e => setForm({ ...form, action_message: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-3 pt-2 border-t border-white/8">
                  <Button onClick={handleCreate} disabled={saving} className="gap-2">
                    {saving ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <Shield className="w-4 h-4" />}
                    Create Rule
                  </Button>
                  <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[{ id: "rules", label: `Rules (${rules.length})` }, { id: "violations", label: `Violations (${violations.length})` }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === t.id ? "bg-primary/20 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl shimmer" />)}</div>
      ) : activeTab === "rules" ? (
        <div className="space-y-3">
          {rules.map((rule, i) => (
            <motion.div key={rule.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <Card glass className={`transition-all ${!rule.is_active ? "opacity-50" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${rule.action_json?.type === "block" ? "bg-red-500/15" : "bg-yellow-500/15"}`}>
                        {rule.action_json?.type === "block"
                          ? <XCircle className="w-4 h-4 text-red-400" />
                          : <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-medium text-sm">{rule.name}</h3>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${ruleTypeColors[rule.rule_type]}`}>{rule.rule_type}</span>
                          <span className={`text-[10px] font-semibold ${actionColors[rule.action_json?.type]}`}>
                            {rule.action_json?.type?.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          IF {rule.condition_json?.field} {rule.condition_json?.operator} {rule.condition_json?.value}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-bold text-orange-400">{rule.violation_count || 0}</p>
                        <p className="text-[10px] text-muted-foreground">violations</p>
                      </div>
                      <button onClick={() => toggleRule(rule)} className="text-muted-foreground hover:text-primary transition-colors">
                        {rule.is_active ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  {rule.action_json?.message && (
                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-white/5 italic">
                      "{rule.action_json.message}"
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {rules.length === 0 && (
            <div className="text-center py-16">
              <Shield className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">No governance rules defined</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {violations.map((v, i) => (
            <motion.div key={v.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <Card glass>
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{v.startup_name || "Unknown startup"} — {v.relationship_type?.replace("_", " ↔ ")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(v.created_at)}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {violations.length === 0 && (
            <div className="text-center py-16">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-400 opacity-40" />
              <p className="text-muted-foreground">No governance violations recorded</p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
