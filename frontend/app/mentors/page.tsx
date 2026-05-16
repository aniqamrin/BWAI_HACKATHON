"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Star, MapPin, Briefcase, Brain, Zap } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { mentorsApi, matchApi, startupsApi } from "@/lib/api";
import { toast } from "@/components/ui/toaster";
import type { Mentor, MentorMatch } from "@/types";
import { truncate } from "@/lib/utils";

export default function MentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [matches, setMatches] = useState<MentorMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [search, setSearch] = useState("");
  const [myStartupId, setMyStartupId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "matches">("all");

  useEffect(() => {
    Promise.all([
      mentorsApi.getAll(),
      startupsApi.getAll(),
    ]).then(([mentorRes, startupRes]: any[]) => {
      setMentors(mentorRes.data?.mentors || []);
      const startups = startupRes.data?.startups || [];
      if (startups.length > 0) setMyStartupId(startups[0].id);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleGetMatches = async () => {
    if (!myStartupId) {
      toast({ title: "Register a startup first to get AI matches", variant: "error" });
      return;
    }
    setMatching(true);
    try {
      const res = await matchApi.matchMentors(myStartupId) as any;
      setMatches(res.data?.matches || []);
      setActiveTab("matches");
      toast({ title: `${res.data?.matches?.length || 0} mentor matches found!`, variant: "success" });
    } catch (err) {
      toast({ title: "Matching failed", description: err instanceof Error ? err.message : "Try again", variant: "error" });
    } finally {
      setMatching(false);
    }
  };

  const filtered = mentors.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.full_name?.toLowerCase().includes(q) ||
      m.company?.toLowerCase().includes(q) ||
      m.expertise?.some((e) => e.toLowerCase().includes(q))
    );
  });

  const availabilityColor = (a: string) => ({
    available: "bg-green-500/20 text-green-400 border-green-500/30",
    limited: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    unavailable: "bg-red-500/20 text-red-400 border-red-500/30",
  }[a] || "bg-gray-500/20 text-gray-400");

  return (
    <DashboardLayout>
      <PageHeader
        title="Mentors"
        description="Expert mentors available in the ecosystem"
        icon={GraduationCap}
        badge={`${mentors.length} mentors`}
        actions={
          <Button variant="gradient" size="sm" onClick={handleGetMatches} disabled={matching}>
            {matching ? (
              <><div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />Matching...</>
            ) : (
              <><Brain className="w-4 h-4 mr-2" />AI Match for My Startup</>
            )}
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[["all", "All Mentors"], ["matches", `AI Matches (${matches.length})`]].map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-primary/20 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "all" && (
        <>
          <div className="relative mb-6">
            <Input placeholder="Search by name, company, expertise..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-4" />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="h-64 rounded-xl shimmer" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((mentor, i) => (
                <motion.div key={mentor.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card glass className="hover:border-green-500/30 transition-all hover:scale-[1.01]">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-cyan-500/20 border border-green-500/20 flex items-center justify-center text-lg font-bold text-green-400">
                          {mentor.full_name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm">{mentor.full_name}</h3>
                          <p className="text-xs text-muted-foreground">{mentor.title} · {mentor.company}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{mentor.location}</span>
                          </div>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${availabilityColor(mentor.availability)}`}>
                          {mentor.availability}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{truncate(mentor.bio || "", 100)}</p>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {(mentor.expertise || []).slice(0, 3).map((e) => (
                          <Badge key={e} variant="cyan" className="text-[10px]">{e}</Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-bold">{mentor.rating}</span>
                          <span className="text-xs text-muted-foreground">({mentor.total_reviews})</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Briefcase className="w-3 h-3" />
                          {mentor.years_experience}y exp
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "matches" && (
        <div className="space-y-4">
          {matches.length === 0 ? (
            <div className="text-center py-20">
              <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground">Click &quot;AI Match for My Startup&quot; to get personalized mentor recommendations</p>
            </div>
          ) : (
            matches.map((match, i) => (
              <motion.div key={match.mentor_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card glass className="hover:border-violet-500/30 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-green-500/20 border border-violet-500/20 flex items-center justify-center text-xl font-bold text-violet-400">
                        {match.mentor_name?.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold">{match.mentor_name}</h3>
                            <p className="text-sm text-muted-foreground">{match.mentor_title} · {match.mentor_company}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black gradient-text">{Math.round(match.compatibility_score)}%</p>
                            <p className="text-xs text-muted-foreground">compatibility</p>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Match Score</span>
                            <span className="text-primary font-medium">{Math.round(match.compatibility_score)}%</span>
                          </div>
                          <Progress value={match.compatibility_score} className="h-1.5" />
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">{match.reasoning}</p>

                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {match.recommended_focus_areas?.map((area) => (
                            <Badge key={area} variant="purple" className="text-[10px]">{area}</Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-yellow-400" />
                            <span className="text-xs text-muted-foreground">{match.estimated_impact}</span>
                          </div>
                          <Button variant="gradient" size="sm">Connect</Button>
                        </div>
                      </div>
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
