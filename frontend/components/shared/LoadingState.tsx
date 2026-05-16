"use client";

import { motion } from "framer-motion";

interface LoadingStateProps {
  message?: string;
  rows?: number;
}

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" };
  return (
    <div className={`${sizes[size]} rounded-full border-2 border-primary/20 border-t-primary animate-spin`} />
  );
}

export function LoadingCards({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-xl border border-white/8 bg-card p-6 space-y-3">
          <div className="shimmer h-4 w-1/3 rounded-lg" />
          <div className="shimmer h-3 w-2/3 rounded-lg" />
          <div className="shimmer h-3 w-1/2 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export default function LoadingState({ message = "Loading...", rows = 3 }: LoadingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20 gap-4"
    >
      <LoadingSpinner size="lg" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </motion.div>
  );
}

export function EmptyState({ title, description, action }: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 gap-3 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-2">
        <div className="w-8 h-8 rounded-lg bg-primary/20" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  );
}
