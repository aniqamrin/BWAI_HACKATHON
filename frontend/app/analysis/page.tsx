"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity, AlertTriangle, CheckCircle, Zap, RefreshCw,
  BarChart3, Clock, Users,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { lifecycleApi } from "@/lib/api";
import { toast } from "@/components/ui/toaster";
import { timeAgo } from "@/lib/utils";

function SignalBar({ label, value, max, unit, color = "violet" }: {
  label: string; value: number; max: number; unit?: string; color?: string;
}) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  const colorMap: Record<string, string> = {
    violet: "from-violet-600 to-blue-500",
    green:  "from-green-600 to-emerald-500",
    yellow: "from-yellow-600 to-amber-500",
    red:    "from-red-600 to-orange-500",
    blue:   "from-blue-600 to-cyan-500",
  };
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground truncate mr-2">{label}</span>
        <span className="font-semibold tabular-nums flex-shrink-0">
          {typeof value === "number" ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}
          {unit && <span className="text-muted-foreground ml-0.5">{unit}</span>}
        </span>
      </div>
      <div className="h-1 rounded-full bg-white/8 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${colorMap[color]}`}
        />
      </div>
    </div>
  );
}

export default function BehavioralSignalsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const load = () => {
    setLoading(true);
    (lifecycleApi as any).getSignals().then((res: any) => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleScan = async () => {
    setScanning(true);
    try {
      await lifecycleApi.run();
      toast({ title: "Lifecycle scan complete — signals updated", variant: "success" });
      load();
    } catch {
      toast({ title: "Scan failed", variant: "error" });
    } finally {
      setScanning(false);
    }
  };

  const signals: any[] = data?.signals || [];
  const atRisk = signals.filter((s: any) => s.composite_index < 50);
  const healthy = signals.filter((s: any) => s.composite_index >= 75);

  return (
    <DashboardLayout>
      <PageHeader
        title="Behavioral Signals"
        description="Composite Engagement Index per relationship — drops below 50 trigger automated alerts"
        icon={Activity}
        badge={`${signals.length} monitored`}
        action={
          <Button onClick={handleScan} disabled={scanning} className="gap-2">
            {scanning
              ? <div className="w-3.5 h-3.5 rounded-full border border-white/30 border-t-white animate-spin" />
              : <RefreshCw className="w-3.5 h-3.5" />}
            Run Lifecycle Scan
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Relationships Monitored", value: signals.length, icon: Users, color: "text-violet-400" },
          { label: "Avg Composite Index", value: data?.avg_composite_index ?? "—", icon: BarChart3, color: "text-blue-400" },
          { label: "At Risk (CEI < 50)", value: atRisk.length, icon: AlertTriangle, color: "text-red-400" },
          { label: "High Engagement (≥ 75)", value: healthy.length, icon: CheckCircle, color: "text-green-400" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card glass>
              <CardContent className="p-4 flex items-center gap-3">
                <stat.icon className={`w-5 h-5 ${stat.color} flex-shrink-0`} />
                <div>
                  <p className="text-xl font-black gradient-text">{stat.value}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-52 rounded-xl shimmer" />)}
        </div>
      ) : signals.length === 0 ? (
        <div className="text-center py-24">
          <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
          <p className="text-muted-foreground mb-2">No behavioral signals computed yet</p>
          <p className="text-xs text-muted-foreground mb-4">Run a lifecycle scan to compute signals for all active relationships</p>
          <Button onClick={handleScan} disabled={scanning} className="gap-2">
            <Zap className="w-4 h-4" /> Run Scan Now
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* At-risk section */}
          {atRisk.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h2 className="text-sm font-semibold text-red-400">At Risk — CEI Below 50</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {atRisk.map((sig: any, i: number) => (
                  <SignalCard key={sig.id} sig={sig} i={i} highlight="red" />
                ))}
              </div>
            </div>
          )}

          {/* All signals */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground">All Monitored Relationships</h2>
              <span className="text-xs text-muted-foreground">(sorted by CEI, lowest first)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {signals.map((sig: any, i: number) => (
                <SignalCard key={sig.id} sig={sig} i={i} />
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function SignalCard({ sig, i, highlight }: { sig: any; i: number; highlight?: string }) {
  const cei = parseFloat(sig.composite_index || 0);
  const ceiColor = cei >= 75 ? "text-green-400" : cei >= 50 ? "text-yellow-400" : "text-red-400";
  const borderClass = highlight === "red" ? "border-red-500/20" : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04 }}
    >
      <Card glass className={`h-full ${borderClass}`}>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-semibold">{sig.startup_name || "Unknown"}</p>
              <p className="text-xs text-muted-foreground">
                ↔ {sig.mentor_name || "Programme/Investor"} · {sig.relationship_type?.replace("_", " ")}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-2xl font-black tabular-nums ${ceiColor}`}>{cei.toFixed(0)}</p>
              <p className="text-[9px] text-muted-foreground">CEI / 100</p>
            </div>
          </div>

          {/* CEI bar */}
          <div className="mb-3">
            <div className="h-2 rounded-full bg-white/8 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, cei)}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={`h-full rounded-full bg-gradient-to-r ${
                  cei >= 75 ? "from-green-600 to-emerald-500"
                  : cei >= 50 ? "from-yellow-600 to-amber-500"
                  : "from-red-600 to-orange-500"
                }`}
              />
            </div>
          </div>

          {/* 5 signal bars */}
          <div className="space-y-2">
            <SignalBar
              label="Meeting Commitment"
              value={Math.round((sig.meeting_commitment_ratio || 0) * 100)}
              max={100} unit="%" color="green"
            />
            <SignalBar
              label="Milestone Completion"
              value={Math.round((sig.milestone_completion_rate || 0) * 100)}
              max={100} unit="%" color="violet"
            />
            <SignalBar
              label="Followthrough Rate"
              value={Math.round((sig.next_action_followthrough_rate || 0) * 100)}
              max={100} unit="%" color="blue"
            />
            <SignalBar
              label="Engagement Velocity"
              value={parseFloat(sig.engagement_velocity || 0)}
              max={1} color={sig.engagement_velocity >= 0.5 ? "green" : "yellow"}
            />
            <SignalBar
              label="Response Latency"
              value={parseFloat(sig.avg_response_latency_hours || 0)}
              max={24} unit="h"
              color={sig.avg_response_latency_hours < 8 ? "green" : "red"}
            />
          </div>

          {sig.computed_at && (
            <p className="text-[10px] text-muted-foreground mt-3 pt-2 border-t border-white/5 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              Computed {timeAgo(sig.computed_at)}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
