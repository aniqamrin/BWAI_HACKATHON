"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Briefcase, GraduationCap, GitBranch, Building2,
  Brain, TrendingUp, Zap, AlertTriangle, CheckCircle, Clock
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/shared/StatCard";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { dashboardApi } from "@/lib/api";
import { formatNumber, getRiskBadge, getHealthColor, timeAgo } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const COLORS = ["#7C3AED", "#2563EB", "#10B981", "#F59E0B", "#EC4899"];

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getInsights().then((res: any) => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-xl shimmer" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 rounded-xl shimmer" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const stats = data?.stats;
  const insights = data?.insights;
  const recent = data?.recent;
  const distributions = data?.distributions;

  const industryData = distributions?.industry?.map((d: any) => ({
    name: d.industry,
    value: parseInt(d.count),
  })) || [];

  return (
    <DashboardLayout>
      <PageHeader
        title="Ecosystem Dashboard"
        description="Real-time intelligence across your innovation ecosystem"
        icon={LayoutDashboard}
        badge="Live"
      />

      {/* AI Insight Banner */}
      {insights?.headline && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-600/10 to-blue-600/10 p-4 flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
            <Brain className="w-4 h-4 text-violet-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-violet-400 font-medium mb-0.5">AI Ecosystem Intelligence</p>
            <p className="text-sm text-foreground">{insights.headline}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold gradient-text">{insights.ecosystem_health_score}</p>
            <p className="text-xs text-muted-foreground">Health Score</p>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Startups"
          value={stats?.startups?.total || 0}
          subtitle={`${stats?.startups?.verified || 0} verified`}
          icon={Briefcase}
          color="purple"
          delay={0}
        />
        <StatCard
          title="Active Mentors"
          value={stats?.mentors?.total || 0}
          subtitle={`${stats?.mentors?.available || 0} available`}
          icon={GraduationCap}
          color="green"
          delay={0.1}
        />
        <StatCard
          title="Relationships"
          value={stats?.relationships?.active || 0}
          subtitle={`${stats?.relationships?.ai_generated || 0} AI-generated`}
          icon={GitBranch}
          color="blue"
          delay={0.2}
        />
        <StatCard
          title="Programmes"
          value={stats?.programmes?.total || 0}
          subtitle={`${stats?.programmes?.open || 0} open`}
          icon={Building2}
          color="orange"
          delay={0.3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Industry Distribution */}
        <Card glass>
          <CardHeader>
            <CardTitle className="text-sm">Industry Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {industryData.length > 0 ? (
              <div className="flex items-center gap-4">
                <PieChart width={120} height={120}>
                  <Pie data={industryData} cx={55} cy={55} innerRadius={35} outerRadius={55} dataKey="value">
                    {industryData.map((_: any, index: number) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="space-y-2 flex-1">
                  {industryData.slice(0, 5).map((d: any, i: number) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-xs text-muted-foreground truncate max-w-[80px]">{d.name}</span>
                      </div>
                      <span className="text-xs font-medium">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>

        {/* Ecosystem Health */}
        <Card glass>
          <CardHeader>
            <CardTitle className="text-sm">Ecosystem Health Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Avg Verification Score", value: parseFloat(stats?.startups?.avg_score || 0), color: "from-violet-600 to-blue-500" },
              { label: "Avg Match Score", value: parseFloat(stats?.relationships?.avg_match_score || 0), color: "from-blue-600 to-cyan-500" },
              { label: "Mentor Availability", value: stats?.mentors?.total > 0 ? (stats.mentors.available / stats.mentors.total) * 100 : 0, color: "from-green-600 to-emerald-500" },
              { label: "Programme Fill Rate", value: stats?.programmes?.total > 0 ? (stats.programmes.ongoing / stats.programmes.total) * 100 : 0, color: "from-orange-600 to-yellow-500" },
            ].map((metric) => (
              <div key={metric.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{metric.label}</span>
                  <span className="font-medium">{Math.round(metric.value)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.value}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={`h-full rounded-full bg-gradient-to-r ${metric.color}`}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card glass>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="w-4 h-4 text-violet-400" />
              AI Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(insights?.key_insights || [
                "Loading ecosystem insights...",
                "AI analysis in progress",
                "Check back shortly"
              ]).slice(0, 4).map((insight: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Startups */}
        <Card glass>
          <CardHeader>
            <CardTitle className="text-sm">Recent Startups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(recent?.startups || []).map((startup: any) => (
                <div key={startup.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-400">
                      {startup.startup_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{startup.startup_name}</p>
                      <p className="text-xs text-muted-foreground">{startup.industry} · {startup.stage}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getRiskBadge(startup.risk_level)}`}>
                      {startup.risk_level}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">{timeAgo(startup.created_at)}</p>
                  </div>
                </div>
              ))}
              {(!recent?.startups || recent.startups.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No startups yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Relationships */}
        <Card glass>
          <CardHeader>
            <CardTitle className="text-sm">Recent Relationships</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(recent?.relationships || []).map((rel: any) => (
                <div key={rel.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${rel.engagement_health === 'excellent' ? 'bg-green-400' : rel.engagement_health === 'good' ? 'bg-blue-400' : 'bg-yellow-400'}`} />
                    <div>
                      <p className="text-sm font-medium">
                        {rel.startup_name || "—"} ↔ {rel.mentor_name || rel.programme_name || rel.investor_name || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{rel.relationship_type?.replace("_", " ↔ ")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{Math.round(rel.match_score)}%</p>
                    <p className="text-xs text-muted-foreground">match</p>
                  </div>
                </div>
              ))}
              {(!recent?.relationships || recent.relationships.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No relationships yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      {insights?.recommendations && insights.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <Card glass>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insights.recommendations.map((rec: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/8">
                    <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-yellow-400">{i + 1}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </DashboardLayout>
  );
}

// Fix missing import
function LayoutDashboard(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>;
}
