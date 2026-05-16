"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-violet-600/8 rounded-full blur-3xl" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-6">
          <Zap className="w-10 h-10 text-violet-400" />
        </div>
        <h1 className="text-8xl font-black gradient-text mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-2">Page not found</h2>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
          This page doesn&apos;t exist in the ecosystem. Let&apos;s get you back on track.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard">
            <Button variant="gradient">Go to Dashboard</Button>
          </Link>
          <Link href="/">
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Home</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
