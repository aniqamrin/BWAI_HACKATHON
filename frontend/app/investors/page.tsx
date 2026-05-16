"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, DollarSign, Briefcase, Globe } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { investorsApi } from "@/lib/api";
import { formatCurrency, truncate } from "@/lib/utils";
import type { Investor } from "@/types";

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    investorsApi.getAll().then((res: any) => {
      setInvestors(res.data?.investors || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <PageHeader
        title="Investors"
        description="Active investors in the ecosystem"
        icon={Users}
        badge={`${investors.length} investors`}
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-48 rounded-xl shimmer" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {investors.map((investor, i) => (
            <motion.div key={investor.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card glass className="hover:border-pink-500/30 transition-all hover:scale-[1.01]">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-pink-500/20 border border-pink-500/20 flex items-center justify-center text-lg font-bold text-pink-400">
                      {investor.firm_name?.charAt(0) || investor.full_name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{investor.firm_name || investor.full_name}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Globe className="w-3 h-3" />
                        {investor.country}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Portfolio</p>
                      <p className="font-bold text-pink-400">{investor.portfolio_size}</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{truncate(investor.investment_thesis || "", 120)}</p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {(investor.focus_industries || []).slice(0, 3).map((ind) => (
                      <Badge key={ind} variant="danger" className="text-[10px]">{ind}</Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 rounded-lg bg-white/5 text-center">
                      <DollarSign className="w-3.5 h-3.5 text-green-400 mx-auto mb-0.5" />
                      <p className="text-xs font-bold">
                        {investor.ticket_size_min ? formatCurrency(investor.ticket_size_min) : "N/A"} – {investor.ticket_size_max ? formatCurrency(investor.ticket_size_max) : "N/A"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Ticket Size</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5 text-center">
                      <Briefcase className="w-3.5 h-3.5 text-blue-400 mx-auto mb-0.5" />
                      <p className="text-xs font-bold">{(investor.investment_stages || []).join(", ")}</p>
                      <p className="text-[10px] text-muted-foreground">Stages</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {investors.length === 0 && (
            <div className="col-span-2 text-center py-20 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No investors yet</p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
