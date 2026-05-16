"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Network, Users, GraduationCap, Briefcase,
  Building2, GitBranch, BarChart3, Settings, LogOut, Zap, 
  Shield, Sparkles, Activity, Bot, BookTemplate, Trophy, 
  Layers, ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/graph", label: "Ecosystem Graph", icon: Network },
  { href: "/startups", label: "Startups", icon: Briefcase },
  { href: "/mentors", label: "Mentors", icon: GraduationCap },
  { href: "/matches", label: "AI Matches", icon: Sparkles },
  { href: "/investors", label: "Investors", icon: Users },
  { href: "/programmes", label: "Programmes", icon: Building2 },
  { href: "/relationships", label: "Relationships", icon: GitBranch },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const ecosystemOsItems = [
  { href: "/blueprints", label: "Blueprints", icon: BookTemplate },
  { href: "/governance", label: "Governance", icon: ShieldCheck },
  { href: "/cohorts", label: "Cohorts", icon: Layers },
  { href: "/outcomes", label: "Outcomes", icon: Trophy },
  { href: "/analysis", label: "Behavioral Signals", icon: Activity },
  { href: "/agent", label: "AI Agent", icon: Bot },
];

const adminItems = [
  { href: "/admin", label: "Admin Panel", icon: Shield },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col border-r border-white/8 bg-card/50 backdrop-blur-xl z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/8">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold gradient-text">EcosystemOS</p>
          <p className="text-[10px] text-muted-foreground">Relationship Intelligence</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                  active
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-4 h-4", active && "text-primary")} />
                {item.label}
                {active && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}

        {/* EcosystemOS v2 features */}
        <div className="pt-4 pb-2 px-3">
          <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3 h-3" /> Relationship OS
          </p>
        </div>
        {ecosystemOsItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                  active
                    ? "bg-violet-500/15 text-violet-400 border border-violet-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-4 h-4", active && "text-violet-400")} />
                {item.label}
                {active && (
                  <motion.div
                    layoutId="activeIndicatorOS"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}

        {user?.role === "admin" && (
          <>
            <div className="pt-4 pb-2 px-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Admin</p>
            </div>
            {adminItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/8">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
            {user?.full_name?.charAt(0) || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{user?.full_name || "User"}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{user?.role || "user"}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
