"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Zap, Network, Brain, Shield, TrendingUp, Users,
  ArrowRight, CheckCircle, Star, Globe, GitBranch, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Brain,
    title: "AI Startup Verification",
    description: "Gemini AI analyzes startup profiles to generate legitimacy scores, risk assessments, and strategic recommendations.",
    color: "from-violet-500/20 to-violet-500/5",
    border: "border-violet-500/20",
    iconColor: "text-violet-400",
  },
  {
    icon: Users,
    title: "Intelligent Mentor Matching",
    description: "AI-powered compatibility scoring matches startups with the most relevant mentors based on expertise, industry, and growth stage.",
    color: "from-blue-500/20 to-blue-500/5",
    border: "border-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    icon: Network,
    title: "Ecosystem Graph Visualization",
    description: "Interactive React Flow graph visualizes all ecosystem relationships — startups, mentors, investors, and programmes.",
    color: "from-cyan-500/20 to-cyan-500/5",
    border: "border-cyan-500/20",
    iconColor: "text-cyan-400",
  },
  {
    icon: GitBranch,
    title: "Relationship Intelligence",
    description: "Track relationship health, engagement quality, and AI-generated next actions for every ecosystem connection.",
    color: "from-green-500/20 to-green-500/5",
    border: "border-green-500/20",
    iconColor: "text-green-400",
  },
  {
    icon: BarChart3,
    title: "Ecosystem Analytics",
    description: "Real-time dashboards with ecosystem health scores, match quality metrics, and AI-generated strategic insights.",
    color: "from-orange-500/20 to-orange-500/5",
    border: "border-orange-500/20",
    iconColor: "text-orange-400",
  },
  {
    icon: Shield,
    title: "Programme Orchestration",
    description: "Automatically match startups to accelerator programmes and government initiatives based on eligibility and fit.",
    color: "from-pink-500/20 to-pink-500/5",
    border: "border-pink-500/20",
    iconColor: "text-pink-400",
  },
];

const stats = [
  { value: "94%", label: "Match Accuracy" },
  { value: "3x", label: "Faster Matching" },
  { value: "82%", label: "Avg Verification Score" },
  { value: "100%", label: "AI-Powered" },
];

const ecosystem = [
  { label: "Startups", color: "bg-violet-500" },
  { label: "Mentors", color: "bg-green-500" },
  { label: "Investors", color: "bg-pink-500" },
  { label: "Programmes", color: "bg-orange-500" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/8 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold gradient-text">EcosystemOS AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button variant="gradient" size="sm">Get Started <ArrowRight className="w-4 h-4 ml-1" /></Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-cyan-600/8 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-sm font-medium mb-8">
              <Zap className="w-3.5 h-3.5" />
              Powered by Google Gemini AI + Vertex AI
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
              <span className="text-foreground">Intelligent</span>
              <br />
              <span className="gradient-text">Ecosystem</span>
              <br />
              <span className="text-foreground">Orchestration</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              AI-native platform that automates relationships between startups, mentors, investors, and accelerators.
              Verify, match, and orchestrate your entire innovation ecosystem.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button variant="gradient" size="xl" className="w-full sm:w-auto">
                  Launch Platform
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="xl" className="w-full sm:w-auto">
                  View Demo Dashboard
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Ecosystem nodes preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 flex items-center justify-center gap-4 flex-wrap"
          >
            {ecosystem.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm"
              >
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                {item.label}
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-muted-foreground text-sm"
            >
              connected by AI
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-white/8">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-4xl font-black gradient-text">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">
              Everything your ecosystem needs
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From AI-powered verification to intelligent relationship orchestration — built for the modern innovation ecosystem.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`rounded-xl border p-6 bg-gradient-to-br ${feature.color} ${feature.border} hover:scale-[1.02] transition-transform duration-200`}
              >
                <div className={`w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4 ${feature.iconColor}`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-24 px-6 border-t border-white/8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Production-ready architecture</h2>
            <p className="text-muted-foreground text-lg">Built on Google Cloud with enterprise-grade scalability</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Frontend",
                items: ["Next.js 15 App Router", "Tailwind CSS + shadcn/ui", "React Flow Visualization", "Framer Motion"],
                color: "border-violet-500/20 bg-violet-500/5",
              },
              {
                title: "Backend + AI",
                items: ["Node.js + Express", "Google Gemini API", "Vertex AI Embeddings", "PostgreSQL"],
                color: "border-blue-500/20 bg-blue-500/5",
              },
              {
                title: "Cloud + DevOps",
                items: ["Google Cloud Run", "Firebase Hosting", "Docker Compose", "BigQuery Analytics"],
                color: "border-cyan-500/20 bg-cyan-500/5",
              },
            ].map((arch, i) => (
              <motion.div
                key={arch.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className={`rounded-xl border p-6 ${arch.color}`}
              >
                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">{arch.title}</h3>
                <ul className="space-y-2">
                  {arch.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-600/10 to-blue-600/10 p-12"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Ready to orchestrate your ecosystem?</h2>
            <p className="text-muted-foreground mb-8">
              Join the platform that turns manual ecosystem coordination into intelligent, automated relationship management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button variant="gradient" size="lg">
                  Start Building <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg">Sign In</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold gradient-text">EcosystemOS AI</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Built for Google Cloud AI Hackathon · Powered by Gemini
          </p>
        </div>
      </footer>
    </div>
  );
}
