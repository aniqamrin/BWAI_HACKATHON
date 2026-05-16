"use client";

import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

export default function ScoreRing({ score, size = "md", label, className }: ScoreRingProps) {
  const sizes = { sm: 60, md: 80, lg: 100 };
  const strokeWidths = { sm: 4, md: 5, lg: 6 };
  const dim = sizes[size];
  const strokeWidth = strokeWidths[size];
  const radius = (dim - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return "#10B981";
    if (score >= 60) return "#F59E0B";
    if (score >= 40) return "#F97316";
    return "#EF4444";
  };

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            "font-bold",
            size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"
          )} style={{ color: getColor() }}>
            {Math.round(score)}
          </span>
        </div>
      </div>
      {label && <p className="text-xs text-muted-foreground">{label}</p>}
    </div>
  );
}
