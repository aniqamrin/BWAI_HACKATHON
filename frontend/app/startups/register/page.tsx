"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, ArrowRight, ArrowLeft, CheckCircle, Brain, Shield, AlertTriangle } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ScoreRing from "@/components/shared/ScoreRing";
import { startupsApi, verifyApi } from "@/lib/api";
import { toast } from "@/components/ui/toaster";
import { getRiskBadge } from "@/lib/utils";

const STEPS = ["Basic Info", "Problem & Solution", "Traction & Funding", "AI Verification"];

export default function RegisterStartupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const [form, setForm] = useState({
    startup_name: "", description: "", industry: "", stage: "seed",
    country: "", website: "", team_size: 1, founded_year: new Date().getFullYear(),
    revenue_model: "", target_market: "", problem_statement: "",
    solution: "", traction: "", funding_raised: 0, funding_needed: 0,
  });

  const update = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await startupsApi.create(form) as any;
      setCreatedId(res.data.id);
      toast({ title: "Startup registered!", variant: "success" });
      setStep(3);
    } catch (err) {
      toast({ title: "Failed to register", description: err instanceof Error ? err.message : "Try again", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!createdId) return;
    setVerifying(true);
    try {
      const res = await verifyApi.verifyStartup(createdId) as any;
      setVerificationResult(res.data);
      toast({ title: "Verification complete!", variant: "success" });
    } catch (err) {
      toast({ title: "Verification failed", description: err instanceof Error ? err.message : "Try again", variant: "error" });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Register Startup"
        description="Add your startup to the ecosystem and get AI-powered verification"
        icon={Briefcase}
      />

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
              i < step ? "bg-green-500 text-white" :
              i === step ? "bg-primary text-white" :
              "bg-white/10 text-muted-foreground"
            }`}>
              {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs ${i === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`w-8 h-px ${i < step ? "bg-green-500" : "bg-white/10"}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card glass>
              <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Startup Name *</Label>
                    <Input placeholder="e.g. PayFlow Africa" value={form.startup_name} onChange={(e) => update("startup_name", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Industry *</Label>
                    <Select value={form.industry} onValueChange={(v) => update("industry", v)}>
                      <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                      <SelectContent>
                        {["FinTech", "AgriTech", "HealthTech", "EdTech", "CleanTech", "LogTech", "GovTech", "E-Commerce", "SaaS", "AI/ML", "Other"].map(i => (
                          <SelectItem key={i} value={i}>{i}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Stage *</Label>
                    <Select value={form.stage} onValueChange={(v) => update("stage", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[["idea","Idea"],["pre-seed","Pre-Seed"],["seed","Seed"],["series-a","Series A"],["series-b","Series B"],["growth","Growth"]].map(([v,l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Country *</Label>
                    <Input placeholder="e.g. Kenya" value={form.country} onChange={(e) => update("country", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input placeholder="https://..." value={form.website} onChange={(e) => update("website", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Team Size</Label>
                    <Input type="number" min={1} value={form.team_size} onChange={(e) => update("team_size", parseInt(e.target.value))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <textarea
                    className="w-full h-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    placeholder="Brief description of your startup..."
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button variant="gradient" onClick={() => setStep(1)} disabled={!form.startup_name || !form.industry || !form.country}>
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card glass>
              <CardHeader><CardTitle>Problem & Solution</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Problem Statement</Label>
                  <textarea className="w-full h-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    placeholder="What problem are you solving?" value={form.problem_statement} onChange={(e) => update("problem_statement", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Your Solution</Label>
                  <textarea className="w-full h-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    placeholder="How does your product solve this?" value={form.solution} onChange={(e) => update("solution", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Revenue Model</Label>
                    <Input placeholder="e.g. SaaS subscription" value={form.revenue_model} onChange={(e) => update("revenue_model", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Market</Label>
                    <Input placeholder="e.g. African SMEs" value={form.target_market} onChange={(e) => update("target_market", e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(0)}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
                  <Button variant="gradient" onClick={() => setStep(2)}>Next <ArrowRight className="w-4 h-4 ml-2" /></Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card glass>
              <CardHeader><CardTitle>Traction & Funding</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Traction / Metrics</Label>
                  <textarea className="w-full h-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    placeholder="e.g. 5,000 users, $50K MRR, 3 enterprise clients..." value={form.traction} onChange={(e) => update("traction", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Funding Raised ($)</Label>
                    <Input type="number" min={0} value={form.funding_raised} onChange={(e) => update("funding_raised", parseFloat(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Funding Needed ($)</Label>
                    <Input type="number" min={0} value={form.funding_needed} onChange={(e) => update("funding_needed", parseFloat(e.target.value))} />
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
                  <Button variant="gradient" onClick={handleCreate} disabled={loading}>
                    {loading ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <>Register & Continue <ArrowRight className="w-4 h-4 ml-2" /></>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card glass>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-violet-400" />
                  AI Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!verificationResult ? (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-6">
                      <Brain className="w-10 h-10 text-violet-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Ready for AI Verification</h3>
                    <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                      Our Gemini AI will analyze your startup profile and generate a legitimacy score, risk assessment, and strategic recommendations.
                    </p>
                    <Button variant="gradient" size="lg" onClick={handleVerify} disabled={verifying}>
                      {verifying ? (
                        <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" /> Analyzing with Gemini AI...</>
                      ) : (
                        <><Brain className="w-4 h-4 mr-2" /> Run AI Verification</>
                      )}
                    </Button>
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {/* Score */}
                    <div className="flex items-center gap-6 p-6 rounded-xl bg-gradient-to-r from-violet-600/10 to-blue-600/10 border border-violet-500/20">
                      <ScoreRing score={verificationResult.verification_score} size="lg" label="Verification Score" />
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{form.startup_name}</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${getRiskBadge(verificationResult.risk_level)}`}>
                            {verificationResult.risk_level} risk
                          </span>
                          <span className="text-xs text-muted-foreground">{verificationResult.industry_classification}</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{verificationResult.stage_classification}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{verificationResult.ai_summary}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Strengths */}
                      <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                        <h4 className="text-xs font-semibold text-green-400 mb-3 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Strengths
                        </h4>
                        <ul className="space-y-1.5">
                          {verificationResult.strengths?.map((s: string, i: number) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <div className="w-1 h-1 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Risk Factors */}
                      <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
                        <h4 className="text-xs font-semibold text-orange-400 mb-3 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Risk Factors
                        </h4>
                        <ul className="space-y-1.5">
                          {verificationResult.risk_factors?.map((r: string, i: number) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <div className="w-1 h-1 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Recommendations */}
                      <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                        <h4 className="text-xs font-semibold text-blue-400 mb-3 flex items-center gap-1">
                          <Brain className="w-3.5 h-3.5" /> AI Recommendations
                        </h4>
                        <ul className="space-y-1.5">
                          {verificationResult.recommendations?.map((r: string, i: number) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="gradient" onClick={() => router.push("/mentors")} className="flex-1">
                        Find Mentors <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      <Button variant="outline" onClick={() => router.push("/startups")}>
                        View All Startups
                      </Button>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
