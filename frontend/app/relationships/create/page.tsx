"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GitBranch, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startupsApi, mentorsApi, programmesApi, investorsApi, relationshipsApi } from "@/lib/api";
import { toast } from "@/components/ui/toaster";
import { RELATIONSHIP_TYPES } from "@/lib/constants";

export default function CreateRelationshipPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [startups, setStartups] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [investors, setInvestors] = useState<any[]>([]);

  const [form, setForm] = useState({
    relationship_type: "mentor_startup",
    startup_id: "",
    mentor_id: "",
    programme_id: "",
    investor_id: "",
    notes: "",
  });

  useEffect(() => {
    Promise.all([
      startupsApi.getAll(),
      mentorsApi.getAll(),
      programmesApi.getAll(),
      investorsApi.getAll(),
    ]).then(([s, m, p, i]: any[]) => {
      setStartups(s.data?.startups || []);
      setMentors(m.data?.mentors || []);
      setProgrammes(p.data?.programmes || []);
      setInvestors(i.data?.investors || []);
    });
  }, []);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = { relationship_type: form.relationship_type, notes: form.notes };
      if (form.startup_id) payload.startup_id = form.startup_id;
      if (form.mentor_id) payload.mentor_id = form.mentor_id;
      if (form.programme_id) payload.programme_id = form.programme_id;
      if (form.investor_id) payload.investor_id = form.investor_id;

      await relationshipsApi.create(payload);
      toast({ title: "Relationship created!", variant: "success" });
      router.push("/relationships");
    } catch (err) {
      toast({ title: "Failed to create", description: err instanceof Error ? err.message : "Try again", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const showMentor = form.relationship_type === "mentor_startup" || form.relationship_type === "mentor_programme";
  const showProgramme = form.relationship_type === "startup_programme" || form.relationship_type === "mentor_programme" || form.relationship_type === "investor_programme";
  const showInvestor = form.relationship_type === "startup_investor" || form.relationship_type === "investor_programme";
  const showStartup = form.relationship_type !== "mentor_programme" && form.relationship_type !== "investor_programme";

  return (
    <DashboardLayout>
      <Link href="/relationships">
        <Button variant="ghost" size="sm" className="mb-6 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Relationships
        </Button>
      </Link>

      <PageHeader
        title="Create Relationship"
        description="Manually create an ecosystem relationship between entities"
        icon={GitBranch}
      />

      <div className="max-w-2xl">
        <Card glass>
          <CardHeader><CardTitle>Relationship Details</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label>Relationship Type *</Label>
                <Select value={form.relationship_type} onValueChange={(v) => update("relationship_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showStartup && (
                <div className="space-y-2">
                  <Label>Startup</Label>
                  <Select value={form.startup_id} onValueChange={(v) => update("startup_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Select startup" /></SelectTrigger>
                    <SelectContent>
                      {startups.map((s) => <SelectItem key={s.id} value={s.id}>{s.startup_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {showMentor && (
                <div className="space-y-2">
                  <Label>Mentor</Label>
                  <Select value={form.mentor_id} onValueChange={(v) => update("mentor_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Select mentor" /></SelectTrigger>
                    <SelectContent>
                      {mentors.map((m) => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {showProgramme && (
                <div className="space-y-2">
                  <Label>Programme</Label>
                  <Select value={form.programme_id} onValueChange={(v) => update("programme_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Select programme" /></SelectTrigger>
                    <SelectContent>
                      {programmes.map((p) => <SelectItem key={p.id} value={p.id}>{p.programme_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {showInvestor && (
                <div className="space-y-2">
                  <Label>Investor</Label>
                  <Select value={form.investor_id} onValueChange={(v) => update("investor_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Select investor" /></SelectTrigger>
                    <SelectContent>
                      {investors.map((i) => <SelectItem key={i.id} value={i.id}>{i.firm_name || i.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <textarea
                  className="w-full h-20 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  placeholder="Any notes about this relationship..."
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="gradient" disabled={loading} className="flex-1">
                  {loading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <><CheckCircle className="w-4 h-4 mr-2" />Create Relationship</>
                  )}
                </Button>
                <Link href="/relationships">
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
