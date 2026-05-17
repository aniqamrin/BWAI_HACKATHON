"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Network, Users, GraduationCap, Briefcase,
  Building2, GitBranch, BarChart3, LogOut, Shield, Sparkles, Activity,
  BookTemplate, Trophy, Layers, ShieldCheck, Bot
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/dashboard",     label: "Dashboard",        icon: LayoutDashboard },
  { href: "/graph",         label: "Ecosystem Graph",  icon: Network },
  { href: "/startups",      label: "Startups",         icon: Briefcase },
  { href: "/mentors",       label: "Mentors",          icon: GraduationCap },
  { href: "/matches",       label: "AI Matches",       icon: Sparkles },
  { href: "/agent",         label: "AI Agent",         icon: Bot },
  { href: "/investors",     label: "Investors",        icon: Users },
  { href: "/programmes",    label: "Programmes",       icon: Building2 },
  { href: "/relationships", label: "Relationships",    icon: GitBranch },
  { href: "/analytics",     label: "Analytics",        icon: BarChart3 },
];

const relationshipOsItems = [
  { href: "/blueprints",    label: "Blueprints",          icon: BookTemplate },
  { href: "/governance",    label: "Governance",          icon: ShieldCheck },
  { href: "/cohorts",       label: "Cohorts",             icon: Layers },
  { href: "/outcomes",      label: "Outcomes",            icon: Trophy },
  { href: "/analysis",      label: "Behavioral Signals",  icon: Activity },
];

const adminItems = [
  { href: "/admin", label: "Admin Panel", icon: Shield },
];

function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: any }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link href={href}>
      <div className={cn(
        "relative flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[13px] font-medium transition-colors duration-100 cursor-pointer group",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}>
        {active && (
          <motion.div
            layoutId="xc-nav-active"
            className="absolute inset-0 rounded-md bg-white/[0.07]"
            transition={{ type: "spring", bounce: 0.15, duration: 0.3 }}
          />
        )}
        <Icon className={cn(
          "w-[15px] h-[15px] relative z-10 flex-shrink-0 transition-colors",
          active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )} />
        <span className="relative z-10 truncate">{label}</span>
        {active && <div className="relative z-10 ml-auto w-1 h-1 rounded-full bg-primary flex-shrink-0" />}
      </div>
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pt-5 pb-2">
      <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.10em]">
        {children}
      </p>
    </div>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-full w-56 flex flex-col border-r border-white/[0.07] bg-[hsl(0,0%,7%)] z-40">
      {/* X Combinator Logo */}
      <div className="flex items-center gap-3 px-4 py-[15px] border-b border-white/[0.07]">
        {/* YC-style "XC" box */}
        <div className="w-7 h-7 rounded bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-[11px] font-black text-white tracking-tighter">XC</span>
        </div>
        <div>
          <p className="text-[13px] font-bold text-foreground tracking-tight leading-none">X Combinator</p>
          <p className="text-[10px] text-muted-foreground leading-none mt-[3px]">Relationship Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
        {navItems.map((item) => (
          <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
        ))}

        <SectionLabel>Relationship OS</SectionLabel>
        {relationshipOsItems.map((item) => (
          <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
        ))}

        {user?.role === "admin" && (
          <>
            <SectionLabel>Admin</SectionLabel>
            {adminItems.map((item) => (
              <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="px-2 py-3 border-t border-white/[0.07]">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-md mb-0.5">
          <div className="w-6 h-6 rounded bg-primary/20 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
            {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium truncate text-foreground leading-tight">{user?.full_name || "User"}</p>
            <p className="text-[10px] text-muted-foreground capitalize leading-tight">{user?.role || "user"}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2.5 px-3 py-[7px] w-full rounded-md text-[13px] text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-colors"
        >
          <LogOut className="w-[15px] h-[15px] flex-shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
