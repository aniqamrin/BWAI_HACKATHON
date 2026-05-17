"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  action?: React.ReactNode;
  badge?: string;
}

export default function PageHeader({ title, description, icon: Icon, actions, action, badge }: PageHeaderProps) {
  const rightContent = actions || action;
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-start justify-between mb-6"
    >
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
            <Icon className="w-[18px] h-[18px] text-primary" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground tracking-tight">{title}</h1>
            {badge && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/[0.07] text-muted-foreground border border-white/[0.08]">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {rightContent && <div className="flex items-center gap-3">{rightContent}</div>}
    </motion.div>
  );
}
