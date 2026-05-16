"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GitBranch, Brain, Activity, Plus, Filter, ChevronRight } from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { relationshipsApi } from "@/lib/api";
import { toast } from "@/components/ui/toaster";
import { getHealthColor, timeAgo } from "@/lib/utils";
import type { Relationship } from "@/types";

const healthColors: Record<string, string> = {
  excellent: "bg-green-500/20 text-green-400 border-green-500/30",
  good: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  fair: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  poor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  inactive: "bg-red-500/20 text-red-400 border-red-500/30",
  new: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const typeLabels: Record<string, string> = {
  mentor_startup: "Mentorship",
  startup_programme: "Programme",
  startup_investor: "Investment",
  mentor_programme: "Mentor-Programme",
  investor_programme: "Investor-Programme",
  partner_startup: "Partnership",
};

const typeColors: Record<string, string> = {
  mentor_startup: "text-violet-400",
  startup_programme: "text-orange-400",
  startup_investor: "text-pink-400",
  mentor_programme: "text-green-400",
  investor_programme: "text-blue-400",
  partner_startup: "text-cyan-400",
};

export default function RelationshipsPage() {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    relationshipsApi.getAll().then((res: any) => {
      setRelationships(res.data?.relationships || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleAnalyzeHealth = async (id: string) => {
    setAnalyzingId(id);
    try {
      const res = await relationshipsApi.analyzeHealth(id) as any;
      const updated = res.data;
      setRelationships((prev) =>
        prev.map((r) => r.id === id ? { ...r, engagement_health: updated.engagement_health } : r)
      );
      toast({ title: "Health analysis complete!", description: `Health: ${updated.engagement_health}`, variant: "success" });
    } catch (err) {
      toast({ title: "Analysis failed", variant: "error" });
    } finally {
      setAnalyzingId(null);
    }
  };

  const filtered = filter === "all" ? relationships : relationships.filter((r) => r.relationship_type === filter);

  const typeFilters = [
    { value: "all", label: "All" },
    { value: "mentor_startup", label: "Mentorships" },
    { value: "startup_programme", label: "Programmes" },
    { value: "startup_investor", label: "Investments" },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Relationships"
        description="All ecosystem relationships and their health status"
        icon={GitBranch}
        badge={`${relationships.length} total`}
      />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {typeFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f.value
                ? "bg-primary/20 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-xl shimmer" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((rel, i) => (
            <motion.div
              key={rel.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card glass className="hover:border-white/15 transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Health indicator */}
                    <div className={`w-2 h-full min-h-[60px] rounded-full flex-shrink-0 ${
                      rel.engagement_health === "excellent" ? "bg-green-500" :
                      rel.engagement_health === "good" ? "bg-blue-500" :
                      rel.engagement_health === "fair" ? "bg-yellow-500" :
                      rel.engagement_health === "poor" ? "bg-orange-500" :
                      "bg-red-500"
                    }`} />

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-semibold ${typeColors[rel.relationship_type]}`}>
                              {typeLabels[rel.relationship_type]}
                            </span>
                            {rel.ai_generated && (
                              <span className="flex items-center gap-1 text-[10px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-full border border-violet-500/20">
                                <Brain className="w-2.5 h-2.5" /> AI
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-sm">
                            {rel.startup_name || "—"} ↔ {rel.mentor_name || rel.programme_name || rel.investor_name || "—"}
                          </h3>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xl font-black gradient-text">{Math.round(rel.match_score)}%</p>
                          <p className="text-[10px] text-muted-foreground">match score</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Match Quality</span>
                            <span className="font-medium">{Math.round(rel.match_score)}%</span>
                          </div>
                          <Progress value={rel.match_score} className="h-1" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Confidence</span>
                            <span className="font-medium">{Math.round(rel.confidence_score)}%</span>
                          </div>
                          <Progress value={rel.confidence_score} className="h-1" indicatorClassName="from-blue-600 to-cyan-500" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${healthColors[rel.engagement_health]}`}>
                            {rel.engagement_health}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                            rel.status === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                          }`}>
                            {rel.status}
                          </span>
                          <span className="text-xs text-muted-foreground">{timeAgo(rel.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleAnalyzeHealth(rel.id)}
                            disabled={analyzingId === rel.id}
                          >
                            {analyzingId === rel.id ? (
                              <div className="w-3 h-3 rounded-full border border-primary/30 border-t-primary animate-spin mr-1" />
                            ) : (
                              <Activity className="w-3 h-3 mr-1" />
                            )}
                            Analyze Health
                          </Button>
                          <Link href={`/relationships/${rel.id}`}>
                            <Button variant="outline" size="sm" className="h-7 text-xs">
                              View <ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </div>

                      {rel.ai_reasoning && (
                        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-white/5 italic">
                          &quot;{rel.ai_reasoning}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <GitBranch className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">No relationships found</p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
