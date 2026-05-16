"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Activity, Upload, RefreshCw, CheckCircle, Clock, Circle,
  TrendingUp, AlertTriangle, Info, Download, ShieldAlert,
  Sparkles, Filter, Brain, Zap
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const signals = [
  {
    timestamp: "2024-03-15 10:14:22",
    responseTime: "450ms",
    sentiment: 0.84,
    sentimentLabel: "High",
    frequency: "12/hr",
    status: "PROCESSED",
  },
  {
    timestamp: "2024-03-15 10:14:45",
    responseTime: "1,200ms",
    sentiment: 0.32,
    sentimentLabel: "Neutral",
    frequency: "8/hr",
    status: "ANALYZING",
  },
  {
    timestamp: "2024-03-15 10:15:02",
    responseTime: "89ms",
    sentiment: -0.12,
    sentimentLabel: "Risk",
    frequency: "42/hr",
    status: "ALERT",
  },
];

const statusConfig = {
  PROCESSED: { color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", border: "border-emerald-400/20" },
  ANALYZING: { color: "text-primary", bg: "bg-primary/10 border-primary/20", border: "border-primary/20" },
  ALERT: { color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", border: "border-red-400/20" },
};

const sentimentColor = (score: number) => {
  if (score > 0.5) return "bg-emerald-400";
  if (score > 0) return "bg-yellow-400";
  return "bg-red-400";
};

export default function BehavioralSignalsPage() {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <DashboardLayout>
      <PageHeader
        title="Behavioral Signals"
        description="Upload interaction logs to identify cognitive biases and engagement patterns"
        icon={Activity}
      />

      <div className="space-y-6">
        {/* Upload Zone */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={() => setIsDragging(false)}
          className={`
            rounded-2xl border-2 border-dashed p-12 flex flex-col items-center justify-center text-center gap-4
            transition-all duration-200 cursor-pointer
            ${isDragging
              ? "border-primary bg-primary/5"
              : "border-white/10 bg-white/[0.02] hover:border-primary/40 hover:bg-primary/[0.03]"
            }
          `}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/20 flex items-center justify-center">
            <Upload className="w-7 h-7 text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Drop behavioral log files here</h3>
            <p className="text-sm text-muted-foreground mt-1">Supports .csv, .xlsx &mdash; max 50MB</p>
          </div>
          <Button className="mt-2 bg-primary hover:bg-primary/90">
            <Upload className="w-4 h-4 mr-2" />
            Process Behavioral Data
          </Button>
        </motion.div>

        {/* Analysis Progress */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                  <CardTitle className="text-sm">Analyzing Signal Clusters...</CardTitle>
                </div>
                <span className="text-sm font-semibold text-primary">64%</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={64} className="h-1.5" />
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs font-medium">Data Sanitization</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary animate-pulse flex-shrink-0" />
                  <span className="text-xs font-medium">Sentiment Mapping</span>
                </div>
                <div className="flex items-center gap-2 opacity-40">
                  <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs font-medium">Predictive Modeling</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Grid: Table + AI Insights */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Signal Table */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="xl:col-span-2"
          >
            <Card className="glass-card">
              <CardHeader className="border-b border-white/8 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Raw Signal Preview</CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1">
                    <Filter className="w-3.5 h-3.5" />
                    Filter Columns
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/8">
                      <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        <th className="px-5 py-3 font-semibold">Timestamp</th>
                        <th className="px-5 py-3 font-semibold">Response Time</th>
                        <th className="px-5 py-3 font-semibold">Sentiment</th>
                        <th className="px-5 py-3 font-semibold">Frequency</th>
                        <th className="px-5 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {signals.map((row, i) => {
                        const cfg = statusConfig[row.status as keyof typeof statusConfig];
                        return (
                          <motion.tr
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + i * 0.08 }}
                            className="hover:bg-white/[0.03] transition-colors"
                          >
                            <td className="px-5 py-4 text-xs font-mono text-muted-foreground whitespace-nowrap">{row.timestamp}</td>
                            <td className="px-5 py-4 text-xs">{row.responseTime}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sentimentColor(row.sentiment)}`} />
                                <span className="text-xs">{row.sentiment.toFixed(2)} <span className="text-muted-foreground">({row.sentimentLabel})</span></span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-xs">{row.frequency}</td>
                            <td className="px-5 py-4">
                              <span className={`text-[10px] px-2 py-1 rounded-full font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                {row.status}
                              </span>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Insights Panel */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex flex-col gap-4"
          >
            {/* Behavioral Trends */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <CardTitle className="text-sm">AI Insights</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-600/10 to-blue-600/10 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Behavioral Trends</span>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-muted-foreground">Rapid response velocity detected — possible anxiety signal</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-muted-foreground">Strong alignment in technical vocabulary usage</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-muted-foreground">Slight engagement drop during pricing discussions</span>
                    </li>
                  </ul>
                </div>
                <Button variant="outline" size="sm" className="w-full text-xs gap-2">
                  <Download className="w-3.5 h-3.5" />
                  Download Report
                </Button>
              </CardContent>
            </Card>

            {/* Risk Map */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="w-4 h-4 text-violet-400" />
                  Risk Intensity Map
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg border-l-4 border-red-500 bg-red-500/5">
                  <p className="text-xs font-semibold text-red-400">Burnout Risk: High</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Pattern: Late night active bursts</p>
                </div>
                <div className="p-3 rounded-lg border-l-4 border-primary bg-primary/5">
                  <p className="text-xs font-semibold text-foreground">Consistency: Stable</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Pattern: Morning alignment</p>
                </div>
                <Button size="sm" className="w-full text-xs gap-2 bg-primary hover:bg-primary/90">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Mitigation Plan
                </Button>
              </CardContent>
            </Card>

            {/* Confidence */}
            <Card className="glass-card">
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Analysis Confidence</span>
                  <div className="flex items-center gap-1.5 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                    <Zap className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-400">HIGH</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Accuracy</span>
                    <span className="font-semibold text-emerald-400">88%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "88%" }}
                      transition={{ duration: 1, delay: 0.6 }}
                      className="h-full rounded-full bg-emerald-400"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground italic">Based on cross-referenced behavioral nodes</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
