"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield, Brain, Briefcase, GraduationCap, GitBranch,
  Building2, Users, TrendingUp, Zap, CheckCircle,
  AlertTriangle, Activity, RefreshCw, Database
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import ScoreRing from "@/components/shared/ScoreRing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dashboardApi, startupsApi, relationshipsApi, verifyApi } from "@/lib/api";
import { toast } from "@/components/ui/toaster";
import { getRiskBadge, getHealthColor, timeAgo, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";

const COLORS = ["#7C3AED", "#2563EB", "#10B981", "#F59E0B", "#EC4899"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card rounded-lg p-3 text-xs">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [overview, setOverview] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [startups, setStartups] = useState<any[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard");
    }
  }, [user, router]);

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [o, i, s, r] = await Promise.all([
        dashboardApi.getOverview(),
        dashboardApi.getInsights(),
        startupsApi.getAll(),
        relationshipsApi.getAll(),
      ]) as any[];
      setOverview(o.data);
      setInsights(i.data?.insights);
      setStartups(s.data?.startups || []);
      setRelationships(r.data?.relationships || []);
    } catch (err) {
      toast({ title: "Failed to load data", variant: "error" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleVerify = async (startupId: string) => {
    setVerifyingId(startupId);
    try {
      const res = await verifyApi.verifyStartup(startupId) as any;
      toast({
        title: "Verification complete",
        description: `Score: ${Math.round(res.data.verification_score)} · Risk: ${res.data.risk_level}`,
        variant: "success",
      });
      loadData();
    } catch (err) {
      toast({ title: "Verification failed", variant: "error" });
    } finally {
      setVerifyingId(null);
    }
  };

  const stats = overview?.stats;
  const industryData = overview?.distributions?.industry?.map((d: any) => ({
    name: d.industry, value: parseInt(d.count),
  })) || [];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-xl shimmer" />)}
          </div>
          <div className="h-96 rounded-xl shimmer" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Admin Panel"
        description="Full ecosystem oversight and management"
        icon={Shield}
        badge="Admin"
        actions={
          <Button variant="outline" size="sm" onClick={loadData} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      {/* AI Health Banner */}
      {insights && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-600/10 via-blue-600/10 to-cyan-600/10 p-5"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/30 to-blue-600/30 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
              <Brain className="w-6 h-6 text-violet-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-violet-400 font-semibold uppercase tracking-wider mb-0.5">Gemini AI · Ecosystem Intelligence</p>
                  <h3 className="font-bold">{insights.headline}</h3>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-3xl font-black gradient-text">{insights.ecosystem_health_score}</p>
                  <p className="text-xs text-muted-foreground">Ecosystem Health</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                {insights.key_insights?.slice(0, 4).map((insight: string, i: number) => (
                  <div key={i} className="flex items-start gap-1.5 p-2 rounded-lg bg-white/5">
                    <Zap className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Startups" value={stats?.startups?.total || 0} subtitle={`${stats?.startups?.verified || 0} verified`} icon={Briefcase} color="purple" delay={0} />
        <StatCard title="Mentors" value={stats?.mentors?.total || 0} subtitle={`${stats?.mentors?.available || 0} available`} icon={GraduationCap} color="green" delay={0.1} />
        <StatCard title="Active Relationships" value={stats?.relationships?.active || 0} subtitle={`${stats?.relationships?.ai_generated || 0} AI-generated`} icon={GitBranch} color="blue" delay={0.2} />
        <StatCard title="Programmes" value={stats?.programmes?.total || 0} subtitle={`${stats?.programmes?.open || 0} open`} icon={Building2} color="orange" delay={0.3} />
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="startups">
        <TabsList className="mb-6">
          <TabsTrigger value="startups">Startups ({startups.length})</TabsTrigger>
          <TabsTrigger value="relationships">Relationships ({relationships.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="ai">AI Insights</TabsTrigger>
        </TabsList>

        {/* ── Startups Tab ── */}
        <TabsContent value="startups">
          <Card glass>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Startup Registry</span>
                <span className="text-xs text-muted-foreground font-normal">{startups.length} total</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {startups.map((startup, i) => (
                  <motion.div
                    key={startup.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 p-4 rounded-xl border border-white/8 bg-white/3 hover:bg-white/5 transition-all"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20 flex items-center justify-center text-sm font-bold text-violet-400 flex-shrink-0">
                      {startup.startup_name?.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-sm truncate">{startup.startup_name}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border flex-shrink-0 ${getRiskBadge(startup.risk_level)}`}>
                          {startup.risk_level}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{startup.industry} · {startup.stage} · {startup.country}</p>
                    </div>

                    {/* Score */}
                    <ScoreRing score={startup.verification_score || 0} size="sm" />

                    {/* Status */}
                    <div className="text-center flex-shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        startup.verification_status === "verified"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                      }`}>
                        {startup.verification_status}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleVerify(startup.id)}
                        disabled={verifyingId === startup.id}
                      >
                        {verifyingId === startup.id ? (
                          <div className="w-3 h-3 rounded-full border border-primary/30 border-t-primary animate-spin" />
                        ) : (
                          <><Brain className="w-3 h-3 mr-1" />Verify</>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ))}

                {startups.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No startups registered yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Relationships Tab ── */}
        <TabsContent value="relationships">
          <Card glass>
            <CardHeader>
              <CardTitle className="text-sm">Relationship Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {relationships.map((rel, i) => (
                  <motion.div
                    key={rel.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 p-4 rounded-xl border border-white/8 bg-white/3 hover:bg-white/5 transition-all"
                  >
                    {/* Health dot */}
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      rel.engagement_health === "excellent" ? "bg-green-400" :
                      rel.engagement_health === "good" ? "bg-blue-400" :
                      rel.engagement_health === "fair" ? "bg-yellow-400" :
                      "bg-red-400"
                    }`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium text-sm truncate">
                          {rel.startup_name || "—"} ↔ {rel.mentor_name || rel.programme_name || rel.investor_name || "—"}
                        </p>
                        {rel.ai_generated && (
                          <span className="text-[10px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-full border border-violet-500/20 flex-shrink-0">
                            AI
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">
                        {rel.relationship_type?.replace("_", " ↔ ")} · {timeAgo(rel.created_at)}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold gradient-text">{Math.round(rel.match_score)}%</p>
                      <p className="text-[10px] text-muted-foreground">match</p>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0 ${
                      rel.engagement_health === "excellent" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                      rel.engagement_health === "good" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                      rel.engagement_health === "fair" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                      "bg-red-500/20 text-red-400 border-red-500/30"
                    }`}>
                      {rel.engagement_health}
                    </span>
                  </motion.div>
                ))}

                {relationships.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <GitBranch className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No relationships yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Analytics Tab ── */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Industry Chart */}
            <Card glass>
              <CardHeader><CardTitle className="text-sm">Startups by Industry</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={industryData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: "#6B7280", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Startups" radius={[4, 4, 0, 0]}>
                      {industryData.map((_: any, index: number) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card glass>
              <CardHeader><CardTitle className="text-sm">Key Performance Metrics</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                {[
                  { label: "Avg Verification Score", value: parseFloat(stats?.startups?.avg_score || 0), color: "from-violet-600 to-blue-500" },
                  { label: "Avg Match Score", value: parseFloat(stats?.relationships?.avg_match_score || 0), color: "from-blue-600 to-cyan-500" },
                  { label: "Excellent Health Relationships", value: stats?.relationships?.total > 0 ? (stats.relationships.excellent_health / stats.relationships.total) * 100 : 0, color: "from-green-600 to-emerald-500" },
                  { label: "AI-Generated Matches", value: stats?.relationships?.total > 0 ? (stats.relationships.ai_generated / stats.relationships.total) * 100 : 0, color: "from-violet-600 to-pink-500" },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">{m.label}</span>
                      <span className="font-semibold">{Math.round(m.value)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${m.value}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className={`h-full rounded-full bg-gradient-to-r ${m.color}`}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* System Status */}
            <Card glass>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Database className="w-4 h-4 text-blue-400" />System Status</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: "API Server", status: "operational", color: "bg-green-400" },
                    { label: "PostgreSQL Database", status: "operational", color: "bg-green-400" },
                    { label: "Gemini AI", status: process.env.NEXT_PUBLIC_GEMINI_KEY ? "operational" : "mock mode", color: "bg-yellow-400" },
                    { label: "Vertex AI Embeddings", status: "configured", color: "bg-blue-400" },
                    { label: "Firebase Auth", status: "ready", color: "bg-blue-400" },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <span className="text-sm">{s.label}</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${s.color} animate-pulse`} />
                        <span className="text-xs text-muted-foreground capitalize">{s.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Summary */}
            <Card glass>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-purple-400" />Ecosystem Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Low Risk Startups", value: stats?.startups?.low_risk || 0, icon: CheckCircle, color: "text-green-400" },
                    { label: "High Risk Startups", value: stats?.startups?.high_risk || 0, icon: AlertTriangle, color: "text-red-400" },
                    { label: "Open Programmes", value: stats?.programmes?.open || 0, icon: Building2, color: "text-orange-400" },
                    { label: "Available Mentors", value: stats?.mentors?.available || 0, icon: GraduationCap, color: "text-green-400" },
                  ].map((item) => (
                    <div key={item.label} className="p-3 rounded-xl bg-white/5 border border-white/8">
                      <item.icon className={`w-4 h-4 ${item.color} mb-2`} />
                      <p className="text-2xl font-bold">{item.value}</p>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── AI Insights Tab ── */}
        <TabsContent value="ai">
          {insights ? (
            <div className="space-y-6">
              {/* Growth Trajectory */}
              <Card glass>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/20 flex items-center justify-center">
                      <TrendingUp className="w-8 h-8 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Growth Trajectory</p>
                      <p className="text-2xl font-bold capitalize">{insights.growth_trajectory}</p>
                      <p className="text-sm text-muted-foreground mt-1">{insights.headline}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-4xl font-black gradient-text">{insights.ecosystem_health_score}</p>
                      <p className="text-xs text-muted-foreground">/ 100 health score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Key Insights */}
                <Card glass>
                  <CardHeader><CardTitle className="text-sm text-violet-400">Key Insights</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {insights.key_insights?.map((insight: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-[10px] font-bold text-violet-400">{i + 1}</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{insight}</p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Opportunities */}
                <Card glass>
                  <CardHeader><CardTitle className="text-sm text-green-400">Opportunities</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {insights.opportunities?.map((o: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-muted-foreground leading-relaxed">{o}</p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card glass>
                  <CardHeader><CardTitle className="text-sm text-yellow-400">AI Recommendations</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {insights.recommendations?.map((r: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <Zap className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-muted-foreground leading-relaxed">{r}</p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Risks */}
              <Card glass>
                <CardHeader><CardTitle className="text-sm text-orange-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Risks to Monitor</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {insights.risks?.map((risk: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/20">
                        <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">{risk}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-20">
              <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">AI insights loading...</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
