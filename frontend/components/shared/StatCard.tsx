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
  purple: {
    bg: "from-violet-600/20 to-violet-600/5",
    border: "border-violet-500/20",
    icon: "bg-violet-500/20 text-violet-400",
    text: "text-violet-400",
  },
  blue: {
    bg: "from-blue-600/20 to-blue-600/5",
    border: "border-blue-500/20",
    icon: "bg-blue-500/20 text-blue-400",
    text: "text-blue-400",
  },
  green: {
    bg: "from-green-600/20 to-green-600/5",
    border: "border-green-500/20",
    icon: "bg-green-500/20 text-green-400",
    text: "text-green-400",
  },
  orange: {
    bg: "from-orange-600/20 to-orange-600/5",
    border: "border-orange-500/20",
    icon: "bg-orange-500/20 text-orange-400",
    text: "text-orange-400",
  },
  pink: {
    bg: "from-pink-600/20 to-pink-600/5",
    border: "border-pink-500/20",
    icon: "bg-pink-500/20 text-pink-400",
    text: "text-pink-400",
  },
  cyan: {
    bg: "from-cyan-600/20 to-cyan-600/5",
    border: "border-cyan-500/20",
    icon: "bg-cyan-500/20 text-cyan-400",
    text: "text-cyan-400",
  },
};

export default function StatCard({
  title, value, subtitle, icon: Icon, trend, color = "purple", delay = 0
}: StatCardProps) {
  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "relative rounded-xl border p-6 overflow-hidden",
        "bg-gradient-to-br",
        colors.bg,
        colors.border
      )}
    >
      {/* Background glow */}
      <div className={cn("absolute -top-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-20 bg-gradient-to-br", colors.bg)} />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold mt-1 text-foreground">{value}</p>
          {subtitle && (
            <p className={cn("text-xs mt-1", colors.text)}>{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={cn("text-xs font-medium", trend.value >= 0 ? "text-green-400" : "text-red-400")}>
                {trend.value >= 0 ? "+" : ""}{trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", colors.icon)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}
