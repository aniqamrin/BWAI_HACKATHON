"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Briefcase, Plus, Search, Shield, TrendingUp, ExternalLink } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ScoreRing from "@/components/shared/ScoreRing";
import { startupsApi } from "@/lib/api";
import { getRiskBadge, getStageLabel, truncate } from "@/lib/utils";
import type { Startup } from "@/types";

export default function StartupsPage() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState({ industry: "", stage: "" });

  useEffect(() => {
    startupsApi.getAll().then((res: any) => {
      setStartups(res.data?.startups || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = startups.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.startup_name.toLowerCase().includes(q) ||
      s.industry?.toLowerCase().includes(q) ||
      s.country?.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout>
      <PageHeader
        title="Startups"
        description="All registered startups in the ecosystem"
        icon={Briefcase}
        badge={`${startups.length} total`}
        actions={
          <Link href="/startups/register">
            <Button variant="gradient" size="sm">
              <Plus className="w-4 h-4 mr-2" /> Register Startup
            </Button>
          </Link>
        }
      />

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search startups by name, industry, country..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-56 rounded-xl shimmer" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((startup, i) => (
            <motion.div
              key={startup.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card glass className="hover:border-violet-500/30 transition-all duration-200 hover:scale-[1.01]">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20 flex items-center justify-center text-sm font-bold text-violet-400">
                        {startup.startup_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{startup.startup_name}</h3>
                        <p className="text-xs text-muted-foreground">{startup.country}</p>
                      </div>
                    </div>
                    <ScoreRing score={startup.verification_score || 0} size="sm" />
                  </div>

                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    {truncate(startup.description || "", 100)}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <Badge variant="purple" className="text-[10px]">{startup.industry}</Badge>
                    <Badge variant="outline" className="text-[10px]">{getStageLabel(startup.stage)}</Badge>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getRiskBadge(startup.risk_level)}`}>
                      {startup.risk_level} risk
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {startup.verification_status === "verified" ? (
                        <Shield className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      <span className="text-xs text-muted-foreground capitalize">{startup.verification_status}</span>
                    </div>
                    <Link href={`/startups/${startup.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        View <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-20 text-muted-foreground">
              <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No startups found</p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
