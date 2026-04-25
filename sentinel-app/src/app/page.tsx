"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Shield, BrainCircuit, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-obsidian)] relative overflow-hidden flex flex-col">
      {/* Massive blurred orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-[var(--accent-purple)] blur-[150px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[50%] rounded-full bg-[var(--accent-cyan)] blur-[150px] opacity-15 pointer-events-none" />

      <Navbar isLanding={true} />

      <main className="flex-1 flex flex-col items-center justify-center pt-40 px-6 max-w-6xl mx-auto w-full z-10">
        
        {/* Status Pill */}
        <div className="mb-12 inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-charcoal)]">
          <div className="w-2 h-2 rounded-full bg-[var(--accent-purple)] animate-pulse shadow-[0_0_8px_var(--accent-purple-glow)]" />
          <span className="text-xs font-medium text-[var(--text-muted)] tracking-wide">
            Sentinel v1.0 is Live on Stellar
          </span>
        </div>

        {/* Massive Hero Typography */}
        <div className="text-center mb-14 max-w-4xl">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[1.05] mb-4">
            <span className="text-white block">Autonomous DeFi.</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-cyan)] block pb-2">
              Zero Custody.
            </span>
          </h1>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-32 w-full sm:w-auto">
          <Link href="/onboarding" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[var(--accent-purple)] hover:bg-[#a855f7] text-white text-lg font-semibold shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2)] transition-all">
              Connect Wallet to Start
            </button>
          </Link>
          <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[var(--bg-charcoal)] border border-[var(--border-subtle)] hover:bg-[rgba(255,255,255,0.05)] text-white text-lg font-medium transition-all">
            View Documentation
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pb-20">
          {[
            {
              title: "Non-Custodial",
              desc: "Smart contracts enforce bounds. The AI can only act within your predefined limits. You never give up your keys.",
              icon: <Shield size={24} className="text-white" strokeWidth={1.5} />,
            },
            {
              title: "Sentiment Engine",
              desc: "Consumes millions of data points from financial news and social APIs, analyzed by LLMs for microsecond edge.",
              icon: <BrainCircuit size={24} className="text-white" strokeWidth={1.5} />,
            },
            {
              title: "Automated Execution",
              desc: "Soroban ensures near-instant settlement. When the signal is clear, the swap executes instantly.",
              icon: <Zap size={24} className="text-white" strokeWidth={1.5} />,
            },
          ].map((feat, idx) => (
            <div key={idx} className="glass-panel p-8 flex flex-col items-start text-left">
              <div className="w-12 h-12 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[var(--border-subtle)] flex items-center justify-center mb-6">
                {feat.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 tracking-tight">{feat.title}</h3>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
