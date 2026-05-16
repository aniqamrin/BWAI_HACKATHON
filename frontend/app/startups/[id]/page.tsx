"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Briefcase, ArrowLeft, Shield, Globe, Users, Calendar,
  DollarSign, Brain, CheckCircle, AlertTriangle, GitBranch,
  TrendingUp, MapPin, ExternalLink, Zap
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import ScoreRing from "@/components/shared/ScoreRing";
import { startupsApi, verifyApi, matchApi, relationshipsApi } from "@/lib/api";
import { toast } from "@/components/ui/toaster";
import { getRiskBadge, getStageLabel, formatCurrency, timeAgo, truncate } from "@/lib/utils";
import type { Startup, MentorMatch, Relationship } from "@/types";

export default function StartupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [startup, setStartup] = useState<Startup | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [mentorMatches, setMentorMatches] = useState<MentorMatch[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [matching, setMatching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      startupsApi.getById(id),
      relationshipsApi.getAll({ startup_id: id }),
    ]).then(([sRes, rRes]: any[]) => {
      setStartup(sRes.data);
      setRelationships(rRes.data?.relationships || []);
      setLoading(false);
    }).catch(() => { setLoading(false); router.push("/startups"); });
  }, [id, router]);

  const handleVerify = async () => {
    if (!id) return;
    setVerifying(true);
    try {
      const res = await verifyApi.verifyStartup(id) as any;
      setStartup((prev) => prev ? {
        ...prev,
        verification_score: res.data.verification_score,
        risk_level: res.data.risk_level,
        ai_summary: res.data.ai_summary,
        verification_status: "verified",
      } : prev);
      toast({ title: "Verification complete!", description: `Score: ${Math.round(res.data.verification_score)}`, variant: "success" });
    } catch {
      toast({ title: "Verification failed", variant: "error" });
    } finally {
      setVerifying(false);
    }
  };

  const handleGetMatches = async () => {
    if (!id) return;
    setMatching(true);
    try {
      const res = await matchApi.matchMentors(id, 3) as any;
      setMentorMatches(res.data?.matches || []);
      toast({ title: `${res.data?.matches?.length} mentor matches found!`, variant: "success" });
    } catch {
      toast({ title: "Matching failed", variant: "error" });
    } finally {
      setMatching(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="h-48 rounded-xl shimmer" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-xl shimmer" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!startup) return null;

  return (
    <DashboardLayout>
      {/* Back */}
      <Link href="/startups">
        <Button variant="ghost" size="sm" className="mb-6 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Startups
        </Button>
      </Link>

      {/* Hero Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card glass className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              {/* Logo */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20 flex items-center justify-center text-3xl font-black text-violet-400 flex-shrink-0">
                {startup.startup_name.charAt(0)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h1 className="text-2xl font-bold">{startup.startup_name}</h1>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="purple">{startup.industry}</Badge>
                      <Badge variant="outline">{getStageLabel(startup.stage)}</Badge>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getRiskBadge(startup.risk_level)}`}>
                        {startup.risk_level} risk
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        startup.verification_status === "verified"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                      }`}>
                        {startup.verification_status}
                      </span>
                    </div>
                  </div>
                  <ScoreRing score={startup.verification_score || 0} size="lg" label="Score" />
                </div>

                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{startup.description}</p>

                <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
                  <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{startup.country}</div>
                  <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{startup.team_size} team members</div>
                  {startup.founded_year && <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Founded {startup.founded_year}</div>}
                  {startup.website && (
                    <a href={startup.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                      <Globe className="w-3.5 h-3.5" />Website <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-5 pt-5 border-t border-white/8">
              <Button variant="gradient" size="sm" onClick={handleVerify} disabled={verifying}>
                {verifying ? <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" /> : <Brain className="w-4 h-4 mr-2" />}
                {verifying ? "Verifying..." : "Run AI Verification"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleGetMatches} disabled={matching}>
                {matching ? <div className="w-3.5 h-3.5 rounded-full border-2 border-primary/30 border-t-primary animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                {matching ? "Matching..." : "Find Mentor Matches"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Problem & Solution */}
        <div className="lg:col-span-2 space-y-4">
          {startup.problem_statement && (
            <Card glass>
              <CardHeader><CardTitle className="text-sm">Problem Statement</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground leading-relaxed">{startup.problem_statement}</p></CardContent>
            </Card>
          )}
          {startup.solution && (
            <Card glass>
              <CardHeader><CardTitle className="text-sm">Solution</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground leading-relaxed">{startup.solution}</p></CardContent>
            </Card>
          )}
          {startup.traction && (
            <Card glass>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-400" />Traction</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground leading-relaxed">{startup.traction}</p></CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar metrics */}
        <div className="space-y-4">
          {/* Funding */}
          <Card glass>
            <CardHeader><CardTitle className="text-sm">Funding</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Raised</p>
                <p className="text-xl font-bold text-green-400">{formatCurrency(startup.funding_raised || 0)}</p>
              </div>
              {startup.funding_needed && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Seeking</p>
                  <p className="text-xl font-bold text-blue-400">{formatCurrency(startup.funding_needed)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {startup.tags && startup.tags.length > 0 && (
            <Card glass>
              <CardHeader><CardTitle className="text-sm">Tags</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {startup.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground">{tag}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active relationships */}
          <Card glass>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><GitBranch className="w-4 h-4 text-blue-400" />Relationships</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-bold gradient-text">{relationships.length}</p>
              <p className="text-xs text-muted-foreground">active connections</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Summary */}
      {startup.ai_summary && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card glass className="mb-6 border-violet-500/20 bg-gradient-to-r from-violet-600/5 to-blue-600/5">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-violet-400" />
                AI Verification Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed italic">&quot;{startup.ai_summary}&quot;</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Mentor Matches */}
      {mentorMatches.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card glass className="mb-6">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" />AI Mentor Matches</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mentorMatches.map((match) => (
                  <div key={match.mentor_id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/8">
                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-sm font-bold text-green-400 flex-shrink-0">
                      {match.mentor_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{match.mentor_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{match.reasoning}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold gradient-text">{Math.round(match.compatibility_score)}%</p>
                      <p className="text-[10px] text-muted-foreground">match</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Relationships */}
      {relationships.length > 0 && (
        <Card glass>
          <CardHeader><CardTitle className="text-sm">Active Relationships</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {relationships.map((rel) => (
                <div key={rel.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/8">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      rel.engagement_health === "excellent" ? "bg-green-400" :
                      rel.engagement_health === "good" ? "bg-blue-400" : "bg-yellow-400"
                    }`} />
                    <div>
                      <p className="text-sm font-medium capitalize">{rel.relationship_type.replace("_", " ↔ ")}</p>
                      <p className="text-xs text-muted-foreground">{rel.mentor_name || rel.programme_name || rel.investor_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-primary">{Math.round(rel.match_score)}%</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      rel.engagement_health === "excellent" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                      "bg-blue-500/20 text-blue-400 border-blue-500/30"
                    }`}>{rel.engagement_health}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
