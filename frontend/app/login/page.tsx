"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, ArrowRight, Eye, EyeOff, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/toaster";

const DEMO_ACCOUNTS = [
  { role: "admin", label: "Admin", email: "admin@ecosystemos.ai", password: "Password123!", color: "text-violet-400 border-violet-500/30 bg-violet-500/10" },
  { role: "startup", label: "Startup", email: "sarah@techstartup.co.ke", password: "Password123!", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  { role: "mentor", label: "Mentor", email: "mchen@mentor.com", password: "Password123!", color: "text-green-400 border-green-500/30 bg-green-500/10" },
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
      toast({
        title: "Login failed",
        description: err instanceof Error ? err.message : "Invalid credentials",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (account: typeof DEMO_ACCOUNTS[0]) => {
    setDemoLoading(account.role);
    try {
      await login(account.email, account.password);
      toast({ title: `Signed in as ${account.label}`, description: "Demo mode active", variant: "success" });
      router.push("/dashboard");
    } catch (err) {
      toast({
        title: "Demo login failed",
        description: err instanceof Error ? err.message : "Try again",
        variant: "error",
      });
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/8 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">EcosystemOS AI</span>
          </Link>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to your ecosystem platform</p>
        </div>

        {/* Demo mode banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 mb-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-yellow-400" />
            <p className="text-xs font-semibold text-yellow-400">One-click demo access</p>
            <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1">
              <WifiOff className="w-3 h-3" /> works offline
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.role}
                onClick={() => handleDemoLogin(account)}
                disabled={demoLoading !== null}
                className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-all hover:scale-[1.02] active:scale-[0.98] ${account.color} disabled:opacity-50`}
              >
                {demoLoading === account.role ? (
                  <div className="w-3 h-3 rounded-full border border-current/30 border-t-current animate-spin mx-auto" />
                ) : (
                  <>
                    <div className="text-sm mb-0.5">
                      {account.role === "admin" ? "🛡️" : account.role === "startup" ? "🚀" : "🎓"}
                    </div>
                    {account.label}
                  </>
                )}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Password for all accounts: <span className="font-mono text-foreground">Password123!</span>
          </p>
        </motion.div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-muted-foreground">or sign in manually</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Form */}
        <div className="glass-card rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="gradient" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
