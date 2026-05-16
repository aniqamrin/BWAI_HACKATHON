"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, User, Sparkles, RotateCcw, ChevronRight } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { agentApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

interface Message {
  id: string;
  role: "user" | "agent";
  text: string;
  timestamp: Date;
}

const SUGGESTED = [
  "How many startups are in the ecosystem?",
  "Show me FinTech startups at seed stage",
  "Which mentors are currently available?",
  "What are the open accelerator programmes?",
  "Give me strategic insights about the ecosystem",
];

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const userText = text.trim();
    if (!userText || loading) return;

    const userMsg: Message = {
      id: uuidv4(),
      role: "user",
      text: userText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await agentApi.chat(userText, sessionId) as any;
      const reply = res?.data?.reply || res?.reply || "No response from agent.";
      setMessages((prev) => [
        ...prev,
        { id: uuidv4(), role: "agent", text: reply, timestamp: new Date() },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "agent",
          text: `Error: ${err.message || "Agent unavailable. Make sure VERTEX_AGENT_ID is set."}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function clearChat() {
    setMessages([]);
    inputRef.current?.focus();
  }

  const empty = messages.length === 0;

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-2rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <PageHeader
            title="AI Agent"
            description="Powered by Gemini — ask anything about your ecosystem"
            icon={Bot}
          />
          {!empty && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-muted-foreground hover:text-foreground gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear
            </Button>
          )}
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-white/8 bg-card/40 backdrop-blur-sm mb-4 p-4 space-y-4">
          {empty && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full gap-6 text-center"
            >
              {/* Agent avatar */}
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background" />
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-1">EcosystemOS Agent</h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  I can query your startup ecosystem in real time — find startups, mentors,
                  programmes, and generate AI-powered match recommendations.
                </p>
              </div>

              {/* Suggested prompts */}
              <div className="flex flex-col gap-2 w-full max-w-lg">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Try asking
                </p>
                {SUGGESTED.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-white/8 bg-white/3 hover:bg-white/8 hover:border-primary/30 text-sm text-left transition-all group"
                  >
                    <span>{s}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                    msg.role === "agent"
                      ? "bg-gradient-to-br from-violet-600 to-blue-600"
                      : "bg-gradient-to-br from-slate-600 to-slate-700"
                  )}
                >
                  {msg.role === "agent" ? (
                    <Bot className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-white" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "agent"
                      ? "bg-card border border-white/8 text-foreground rounded-tl-sm"
                      : "bg-primary/15 border border-primary/20 text-foreground rounded-tr-sm"
                  )}
                >
                  <MessageContent text={msg.text} />
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-card border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-4">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the agent anything about your ecosystem…"
              rows={1}
              className={cn(
                "w-full resize-none rounded-xl border border-white/10 bg-card/60 px-4 py-3 pr-12",
                "text-sm placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/40",
                "max-h-32 overflow-y-auto backdrop-blur-sm"
              )}
              style={{ height: "auto" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 128) + "px";
              }}
              disabled={loading}
            />
          </div>
          <Button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="h-11 w-11 p-0 rounded-xl bg-primary hover:bg-primary/90 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-2 flex-shrink-0">
          Agent uses live ecosystem data · Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </DashboardLayout>
  );
}

// Renders markdown-lite: **bold**, `code`, bullet lists, numbered lists, blank lines
function MessageContent({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;

        const isBullet = /^[-•*]\s/.test(line.trim());
        const isNumbered = /^\d+\.\s/.test(line.trim());
        const content = isBullet
          ? line.trim().replace(/^[-•*]\s/, "")
          : isNumbered
          ? line.trim().replace(/^\d+\.\s/, "")
          : line;

        const rendered = renderInline(content);

        if (isBullet) {
          return (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-primary mt-1 flex-shrink-0 text-xs">•</span>
              <span>{rendered}</span>
            </div>
          );
        }
        if (isNumbered) {
          const num = line.trim().match(/^(\d+)\./)?.[1];
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="text-muted-foreground flex-shrink-0 text-xs tabular-nums min-w-[16px]">{num}.</span>
              <span>{rendered}</span>
            </div>
          );
        }
        return <p key={i}>{rendered}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode[] {
  // Split on **bold** and `code` patterns
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, j) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={j} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={j} className="px-1 py-0.5 rounded text-[11px] bg-white/10 text-violet-300 font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
