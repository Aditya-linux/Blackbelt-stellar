"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogEntry } from "@/types";
import { Activity, AlertTriangle, Info, ShieldCheck, Zap, Server } from "lucide-react";

interface LiveLogsProps {
  logs: LogEntry[];
  connected: boolean;
}

function getIconForTag(tag: string) {
  switch (tag) {
    case "[TRADE]": return <Zap size={16} className="text-[var(--status-buy)]" />;
    case "[ALERT]": return <AlertTriangle size={16} className="text-[var(--status-sell)]" />;
    case "[SCAN]":  return <Activity size={16} className="text-[var(--accent-purple)]" />;
    case "[INFO]":  return <Info size={16} className="text-[var(--status-info)]" />;
    case "[ERROR]": return <AlertTriangle size={16} className="text-[var(--status-sell)]" />;
    case "[SYSTEM]": return <Server size={16} className="text-[var(--text-muted)]" />;
    default: return <ShieldCheck size={16} className="text-[var(--accent-cyan)]" />;
  }
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour12: true, hour: "numeric", minute: "2-digit" });
  } catch {
    return "00:00";
  }
}

export default function LiveLogs({ logs, connected }: LiveLogsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glass-card flex flex-col h-full bg-[rgba(20,20,25,0.6)] backdrop-blur-xl border-[rgba(255,255,255,0.05)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-3">
          <Activity className="text-[var(--text-primary)]" size={24} />
          <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
            Activity Feed
          </h3>
        </div>
        <div className="flex items-center gap-2 bg-[rgba(255,255,255,0.03)] px-4 py-1.5 rounded-full border border-[rgba(255,255,255,0.05)]">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{
              background: connected ? "var(--status-buy)" : "var(--status-sell)",
              boxShadow: connected
                ? "0 0 10px rgba(61, 214, 140, 0.6)"
                : "0 0 10px rgba(248, 113, 113, 0.6)",
            }}
          />
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            {connected ? "Live" : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Feed List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
      >
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] opacity-70">
            <Activity size={32} className="mb-3 opacity-50" />
            <p className="text-sm">Awaiting new events...</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {logs.map((entry, idx) => (
              <motion.div
                key={`${entry.timestamp}-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-4 p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.04)] transition-colors"
              >
                <div className="mt-0.5 p-1.5 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.02)]">
                  {getIconForTag(entry.tag)}
                </div>
                
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {entry.tag.replace(/\[|\]/g, '')}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>
                  <span className="text-sm text-[var(--text-secondary)] leading-relaxed break-words">
                    {entry.message}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
