"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Brain, Zap } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardApi } from "@/lib/api";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#7C3AED", "#2563EB", "#10B981", "#F59E0B", "#EC4899", "#06B6D4"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
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

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardApi.getOverview(),
      dashboardApi.getAnalytics(),
      dashboardApi.getInsights(),
    ]).then(([o, a, i]: any[]) => {
      setOverview(o.data);
      setAnalytics(a.data);
      setInsights(i.data?.insights);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const industryData = overview?.distributions?.industry?.map((d: any) => ({
    name: d.industry || "Unknown",
    value: parseInt(d.count),
  })) || [];

  const verificationData = overview?.distributions?.verification?.map((d: any) => ({
    name: d.verification_status,
    value: parseInt(d.count),
  })) || [];

  const topStartups = analytics?.top_startups || [];

  return (
    <DashboardLayout>
      <PageHeader
        title="Analytics"
        description="Deep ecosystem intelligence and performance metrics"
        icon={BarChart3}
      />

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-64 rounded-xl shimmer" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {/* AI Insights Banner */}
          {insights && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-600/10 to-blue-600/10 p-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-5 h-5 text-violet-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">AI Ecosystem Intelligence</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black gradient-text">{insights.ecosystem_health_score}</span>
                      <span className="text-xs text-muted-foreground">/ 100 health</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{insights.headline}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {insights.key_insights?.slice(0, 4).map((insight: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <Zap className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Industry Distribution */}
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

            {/* Verification Status */}
            <Card glass>
              <CardHeader><CardTitle className="text-sm">Verification Status</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie data={verificationData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
                        {verificationData.map((_: any, index: number) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3 flex-1">
                    {verificationData.map((d: any, i: number) => (
                      <div key={d.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="text-xs capitalize">{d.name}</span>
                        </div>
                        <span className="text-sm font-bold">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Startups */}
          <Card glass>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-400" />Top Verified Startups</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topStartups.map((startup: any, i: number) => (
                  <div key={startup.startup_name} className="flex items-center gap-4">
                    <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{startup.startup_name}</span>
                        <span className="text-xs text-muted-foreground">{startup.industry}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${startup.verification_score}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className="h-full rounded-full"
                          style={{ background: COLORS[i % COLORS.length] }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-bold w-10 text-right" style={{ color: COLORS[i % COLORS.length] }}>
                      {Math.round(startup.verification_score)}
                    </span>
                  </div>
                ))}
                {topStartups.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No verified startups yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Opportunities & Risks */}
          {insights && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card glass>
                <CardHeader><CardTitle className="text-sm text-green-400">Opportunities</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {insights.opportunities?.map((o: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                        {o}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card glass>
                <CardHeader><CardTitle className="text-sm text-orange-400">Risks to Monitor</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {insights.risks?.map((r: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
