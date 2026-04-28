"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RiskProfile } from "@/types";
import { SlidersHorizontal } from "lucide-react";

interface RiskSliderProps {
  currentProfile: RiskProfile["label"];
  onProfileChange: (profile: RiskProfile["label"]) => void;
  disabled?: boolean;
}

const PROFILES: { key: RiskProfile["label"]; label: string; desc: string; color: string }[] = [
  {
    key: "conservative",
    label: "Conservative",
    desc: "Low risk, requires high confidence",
    color: "var(--status-info)",
  },
  {
    key: "balanced",
    label: "Balanced",
    desc: "Moderate risk, balanced trades",
    color: "var(--accent-purple)",
  },
  {
    key: "aggressive",
    label: "Aggressive",
    desc: "High risk, maximum throughput",
    color: "var(--status-sell)",
  },
];

export default function RiskSlider({ currentProfile, onProfileChange, disabled }: RiskSliderProps) {
  const currentIdx = PROFILES.findIndex((p) => p.key === currentProfile);
  const activeProfile = PROFILES[currentIdx];

  return (
    <div className="glass-card p-8 flex flex-col h-full min-h-[320px] justify-between">
      <div className="flex items-center gap-4 mb-8">
        <SlidersHorizontal size={24} className="text-[var(--accent-purple)]" strokeWidth={2} />
        <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
          Risk Tolerance
        </h3>
      </div>

      {/* Slider track */}
      <div className="relative flex-1 flex flex-col justify-center my-6">
        <div className="flex items-center justify-between relative px-4">
          {/* Track background */}
          <div
            className="absolute top-1/2 left-6 right-6 h-2 -translate-y-1/2 rounded-full"
            style={{ background: "rgba(255,255,255,0.05)" }}
          />
          {/* Active track */}
          <motion.div
            className="absolute top-1/2 left-6 h-2 -translate-y-1/2 rounded-full"
            style={{ background: activeProfile.color, width: `calc(${currentIdx * 50}% - 24px)` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />

          {/* Steps */}
          {PROFILES.map((profile, idx) => (
            <button
              key={profile.key}
              disabled={disabled}
              onClick={() => onProfileChange(profile.key)}
              className="relative z-10 flex flex-col items-center group focus:outline-none"
              style={{ cursor: disabled ? "not-allowed" : "pointer" }}
            >
              <motion.div
                className="rounded-full border-[4px] flex items-center justify-center bg-[var(--bg-card)] transition-colors"
                style={{
                  width: 36,
                  height: 36,
                  borderColor: idx <= currentIdx ? profile.color : "var(--border-subtle)",
                }}
                animate={{
                  scale: idx === currentIdx ? 1.2 : 1,
                  boxShadow: idx === currentIdx ? `0 0 25px ${profile.color}66` : "none",
                }}
              >
                {idx === currentIdx && (
                  <motion.div
                    className="rounded-full w-3 h-3"
                    style={{ background: profile.color }}
                    layoutId="risk-dot"
                  />
                )}
              </motion.div>
            </button>
          ))}
        </div>

        {/* Labels */}
        <div className="flex justify-between mt-8 px-2">
          {PROFILES.map((profile, idx) => (
            <p
              key={profile.key}
              className="text-sm font-semibold tracking-wide text-center w-[33%] transition-colors duration-300"
              style={{
                color: idx === currentIdx ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              {profile.label}
            </p>
          ))}
        </div>
      </div>

      {/* Active profile description */}
      <motion.div
        key={currentProfile}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl p-5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] mt-4"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: activeProfile.color }} />
          <p className="text-base font-bold text-[var(--text-primary)]">
            {activeProfile.label} Mode
          </p>
        </div>
        <p className="text-sm text-[var(--text-secondary)] font-medium ml-5.5">
          {activeProfile.desc}
        </p>
      </motion.div>
    </div>
  );
}
