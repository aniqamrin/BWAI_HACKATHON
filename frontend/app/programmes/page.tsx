"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Calendar, DollarSign, Users, Brain, ExternalLink } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { programmesApi, matchApi, startupsApi } from "@/lib/api";
import { toast } from "@/components/ui/toaster";
import { formatCurrency, truncate } from "@/lib/utils";
import type { Programme } from "@/types";

const statusColors: Record<string, string> = {
  open: "bg-green-500/20 text-green-400 border-green-500/30",
  ongoing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  completed: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export default function ProgrammesPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [myStartupId, setMyStartupId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "matches">("all");

  useEffect(() => {
    Promise.all([programmesApi.getAll(), startupsApi.getAll()]).then(([pRes, sRes]: any[]) => {
      setProgrammes(pRes.data?.programmes || []);
      const startups = sRes.data?.startups || [];
      if (startups.length > 0) setMyStartupId(startups[0].id);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleGetMatches = async () => {
    if (!myStartupId) {
      toast({ title: "Register a startup first", variant: "error" });
      return;
    }
    setMatching(true);
    try {
      const res = await matchApi.matchProgrammes(myStartupId) as any;
      setMatches(res.data?.matches || []);
      setActiveTab("matches");
      toast({ title: `${res.data?.matches?.length || 0} programme matches found!`, variant: "success" });
    } catch (err) {
      toast({ title: "Matching failed", variant: "error" });
    } finally {
      setMatching(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Programmes"
        description="Accelerators, grants, and government programmes"
        icon={Building2}
        badge={`${programmes.length} programmes`}
        actions={
          <Button variant="gradient" size="sm" onClick={handleGetMatches} disabled={matching}>
            {matching ? (
              <><div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />Matching...</>
            ) : (
              <><Brain className="w-4 h-4 mr-2" />AI Match Programmes</>
            )}
          </Button>
        }
      />

      <div className="flex gap-2 mb-6">
        {[["all", "All Programmes"], ["matches", `AI Matches (${matches.length})`]].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? "bg-primary/20 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === "all" && (
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-64 rounded-xl shimmer" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {programmes.map((prog, i) => (
              <motion.div key={prog.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card glass className="hover:border-orange-500/30 transition-all hover:scale-[1.01]">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/20 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{prog.programme_name}</h3>
                          <p className="text-xs text-muted-foreground">{prog.organizer} · {prog.country}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColors[prog.status]}`}>
                        {prog.status}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{truncate(prog.description || "", 100)}</p>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {(prog.focus_area || []).slice(0, 3).map((area) => (
                        <Badge key={area} variant="warning" className="text-[10px]">{area}</Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="text-center p-2 rounded-lg bg-white/5">
                        <DollarSign className="w-3.5 h-3.5 text-green-400 mx-auto mb-0.5" />
                        <p className="text-xs font-bold">{prog.funding_offered ? formatCurrency(prog.funding_offered) : "N/A"}</p>
                        <p className="text-[10px] text-muted-foreground">Funding</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-white/5">
                        <Users className="w-3.5 h-3.5 text-blue-400 mx-auto mb-0.5" />
                        <p className="text-xs font-bold">{prog.cohort_size}</p>
                        <p className="text-[10px] text-muted-foreground">Cohort</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-white/5">
                        <Calendar className="w-3.5 h-3.5 text-purple-400 mx-auto mb-0.5" />
                        <p className="text-xs font-bold">{prog.duration_weeks || "?"}</p>
                        <p className="text-[10px] text-muted-foreground">Weeks</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {(prog.benefits || []).slice(0, 3).map((b) => (
                        <span key={b} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">{b}</span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )
      )}

      {activeTab === "matches" && (
        <div className="space-y-4">
          {matches.length === 0 ? (
            <div className="text-center py-20">
              <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground">Click &quot;AI Match Programmes&quot; to find the best programmes for your startup</p>
            </div>
          ) : (
            matches.map((match, i) => (
              <motion.div key={match.programme_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card glass className="hover:border-orange-500/30 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold">{match.programme_name}</h3>
                        <p className="text-sm text-muted-foreground">{match.organizer} · {match.country}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black gradient-text">{Math.round(match.fit_score)}%</p>
                        <p className="text-xs text-muted-foreground">fit score</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{match.reasoning}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          match.application_recommendation === "strong_apply" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                          match.application_recommendation === "apply" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                          "bg-gray-500/20 text-gray-400 border-gray-500/30"
                        }`}>
                          {match.application_recommendation?.replace("_", " ")}
                        </span>
                        <span className="text-xs text-muted-foreground">{match.eligibility_assessment?.replace("_", " ")}</span>
                      </div>
                      <Button variant="gradient" size="sm">Apply Now</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
