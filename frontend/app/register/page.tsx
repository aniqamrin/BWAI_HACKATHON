"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, User, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/toaster";

export default function RegisterPage() {
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "startup", country: "" });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "error" });
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast({ title: "Account created!", description: "Welcome to X Combinator", variant: "success" });
      router.push("/dashboard");
    } catch (err) {
      toast({ title: "Registration failed", description: err instanceof Error ? err.message : "Please try again", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
            <span className="text-[11px] font-black text-white">XC</span>
          </div>
          <span className="text-[14px] font-bold text-foreground">X Combinator</span>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-1 tracking-tight">Create account</h1>
        <p className="text-sm text-muted-foreground mb-8">Join the ecosystem platform</p>

        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Your full name" value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="pl-9" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px]">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="email" placeholder="you@example.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} className="pl-9" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px]">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="password" placeholder="Min. 8 characters" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} className="pl-9" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[13px]">Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startup">Startup</SelectItem>
                    <SelectItem value="mentor">Mentor</SelectItem>
                    <SelectItem value="investor">Investor</SelectItem>
                    <SelectItem value="user">Observer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px]">Country</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Kenya" value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })} className="pl-9" />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full mt-2" size="lg" disabled={loading}>
              {loading
                ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : <>Create Account <ArrowRight className="w-4 h-4 ml-2" /></>
              }
            </Button>
          </form>
        </div>

        <p className="text-center text-[13px] text-muted-foreground mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
