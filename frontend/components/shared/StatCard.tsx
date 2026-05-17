"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: "purple" | "blue" | "green" | "orange" | "pink" | "cyan";
  delay?: number;
}

const colorMap = {
  purple: { icon: "text-violet-400" },
  blue:   { icon: "text-blue-400" },
  green:  { icon: "text-green-400" },
  orange: { icon: "text-orange-400" },
  pink:   { icon: "text-pink-400" },
  cyan:   { icon: "text-cyan-400" },
};

export default function StatCard({
  title, value, subtitle, icon: Icon, trend, color = "purple", delay = 0
}: StatCardProps) {
  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className="rounded-xl border border-white/[0.08] bg-card p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.06] flex items-center justify-center">
          <Icon className={cn("w-4 h-4", colors.icon)} />
        </div>
        {trend && (
          <span className={cn("text-xs font-medium tabular-nums", trend.value >= 0 ? "text-green-400" : "text-red-400")}>
            {trend.value >= 0 ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
      {subtitle && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{subtitle}</p>}
    </motion.div>
  );
}
