"use client";

import { motion } from "framer-motion";
import { SentinelStatus } from "@/types";

interface HeroStatusProps {
  status: SentinelStatus;
  totalTrades: number;
  uptime: number;
}

const STATUS_CONFIG: Record<SentinelStatus, {
  label: string;
  color: string;
  glowColor: string;
  ringColor: string;
  desc: string;
}> = {
  sleeping: {
    label: "STANDBY",
    color: "var(--text-muted)",
    glowColor: "rgba(113, 113, 122, 0.05)",
    ringColor: "rgba(255, 255, 255, 0.05)",
    desc: "Awaiting activation",
  },
  analyzing: {
    label: "ANALYZING",
    color: "var(--accent-purple)",
    glowColor: "var(--accent-purple-glow)",
    ringColor: "var(--accent-purple-dim)",
    desc: "Scanning global sentiment",
  },
  executing: {
    label: "EXECUTING",
    color: "var(--status-buy)",
    glowColor: "var(--accent-cyan-glow)",
    ringColor: "var(--accent-cyan-dim)",
    desc: "Deploying on-chain swap",
  },
};

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function HeroStatus({ status, totalTrades, uptime }: HeroStatusProps) {
  const cfg = STATUS_CONFIG[status];

  return (
    <div className="glass-card p-8 flex flex-col items-center justify-center h-full min-h-[320px] relative overflow-hidden group">
      {/* Background Glow */}
      <motion.div
        className="absolute w-full h-full rounded-full blur-[120px] opacity-40 pointer-events-none transition-colors duration-1000"
        style={{ background: cfg.glowColor }}
        animate={{ scale: status === "analyzing" ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Animated SVG Indicator */}
      <div className="relative flex items-center justify-center mb-6" style={{ width: 160, height: 160 }}>
        {/* Outer dashed ring */}
        <motion.svg
          width="160"
          height="160"
          viewBox="0 0 160 160"
          className="absolute"
          animate={{ rotate: status === "analyzing" ? 360 : 0 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <circle
            cx="80"
            cy="80"
            r="78"
            fill="none"
            stroke={cfg.ringColor}
            strokeWidth="1.5"
            strokeDasharray="4 8"
            opacity="0.6"
            className="transition-colors duration-1000"
          />
        </motion.svg>

        {/* Middle solid ring */}
        <motion.div
          className="absolute rounded-full transition-colors duration-1000"
          style={{
            width: 120,
            height: 120,
            border: `2px solid ${cfg.color}`,
            opacity: 0.2,
          }}
          animate={{ scale: status === "executing" ? [1, 1.08, 1] : 1 }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        {/* Core Shield SVG */}
        <motion.svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          animate={{
            scale: status === "executing" ? [1, 1.15, 1] : 1,
            opacity: status === "sleeping" ? 0.6 : 1,
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <path
            d="M32 4L8 16v16c0 14.4 10.24 27.84 24 32 13.76-4.16 24-17.6 24-32V16L32 4z"
            fill={status === "executing" ? "rgba(61, 214, 140, 0.15)" : "none"}
            stroke={cfg.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-colors duration-1000"
          />
          {/* Inner eye */}
          <motion.circle
            cx="32"
            cy="30"
            r="8"
            fill="none"
            stroke={cfg.color}
            strokeWidth="2"
            animate={{ r: status === "analyzing" ? [8, 11, 8] : 8 }}
            transition={{ duration: 2, repeat: Infinity }}
            className="transition-colors duration-1000"
          />
          <motion.circle
            cx="32"
            cy="30"
            r="3"
            fill={cfg.color}
            animate={{ opacity: status === "sleeping" ? 0.4 : [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="transition-colors duration-1000"
          />
        </motion.svg>
      </div>

      {/* Status text */}
      <div className="text-center z-10 flex flex-col items-center">
        <motion.div
          className="px-4 py-1.5 rounded-full border mb-3 flex items-center gap-3 bg-[rgba(255,255,255,0.03)] backdrop-blur-md transition-colors duration-1000"
          style={{ borderColor: cfg.ringColor }}
        >
          <motion.div
            className="w-2.5 h-2.5 rounded-full transition-colors duration-1000 shadow-[0_0_8px_currentColor]"
            style={{ background: cfg.color, color: cfg.color }}
            animate={{ opacity: status === "sleeping" ? 0.5 : [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span
            className="text-[13px] font-black tracking-widest uppercase font-mono transition-colors duration-1000"
            style={{ color: cfg.color }}
          >
            {cfg.label}
          </span>
        </motion.div>
        
        <p className="text-sm text-[var(--text-muted)] font-medium">
          {cfg.desc}
        </p>
      </div>
    </div>
  );
}
