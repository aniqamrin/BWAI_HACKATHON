"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Eye, EyeOff, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/toaster";

const DEMO_ACCOUNTS = [
  { role: "admin",   label: "Admin",   email: "admin@ecosystemos.ai",     password: "Password123!" },
  { role: "startup", label: "Startup", email: "sarah@techstartup.co.ke",  password: "Password123!" },
  { role: "mentor",  label: "Mentor",  email: "mchen@mentor.com",         password: "Password123!" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast({ title: "Welcome back!", variant: "success" });
      router.push("/dashboard");
    } catch (err) {
      toast({ title: "Login failed", description: err instanceof Error ? err.message : "Invalid credentials", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (account: typeof DEMO_ACCOUNTS[0]) => {
    setDemoLoading(account.role);
    try {
      await login(account.email, account.password);
      toast({ title: `Signed in as ${account.label}`, variant: "success" });
      router.push("/dashboard");
    } catch {
      toast({ title: "Demo login failed", variant: "error" });
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 border-r border-white/[0.07] bg-[hsl(0,0%,7%)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <span className="text-[12px] font-black text-white tracking-tighter">XC</span>
          </div>
          <span className="text-[15px] font-bold text-foreground tracking-tight">X Combinator</span>
        </div>

        <div>
          <blockquote className="text-2xl font-semibold text-foreground leading-snug mb-6 tracking-tight">
            "The platform that turns manual ecosystem coordination into automated, programmable relationships."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">A</div>
            <div>
              <p className="text-sm font-medium text-foreground">Admin User</p>
              <p className="text-xs text-muted-foreground">Ecosystem Administrator</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">© 2025 X Combinator. All rights reserved.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
              <span className="text-[11px] font-black text-white">XC</span>
            </div>
            <span className="text-[14px] font-bold text-foreground">X Combinator</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-1 tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground mb-8">Enter your credentials to access the platform</p>

          {/* Demo access */}
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs font-semibold text-foreground">One-click demo access</p>
              <span className="ml-auto text-[10px] text-muted-foreground">works offline</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.role}
                  onClick={() => handleDemoLogin(account)}
                  disabled={demoLoading !== null}
                  className="py-2.5 px-3 rounded-md text-[12px] font-semibold border border-white/[0.10] bg-white/[0.04] text-foreground hover:bg-white/[0.08] hover:border-primary/40 transition-all disabled:opacity-40 capitalize"
                >
                  {demoLoading === account.role ? (
                    <div className="w-3 h-3 rounded-full border border-white/30 border-t-white animate-spin mx-auto" />
                  ) : account.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2.5 text-center">
              Password: <span className="font-mono text-foreground">Password123!</span>
            </p>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-[11px] text-muted-foreground">or sign in manually</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[13px]">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} className="pl-9" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[13px]">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 pr-9" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading
                ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : <> Sign In <ArrowRight className="w-4 h-4 ml-2" /> </>
              }
            </Button>
          </form>

          <p className="text-center text-[13px] text-muted-foreground mt-6">
            No account?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">Create one</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
