"use client";

import Link from "next/link";
import { Zap, ChevronDown, Wallet } from "lucide-react";

interface NavbarProps {
  walletAddress?: string | null;
  connected?: boolean;
  connecting?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  isLanding?: boolean;
}

export default function Navbar({ 
  walletAddress, 
  connected, 
  connecting, 
  onConnect, 
  onDisconnect,
  isLanding = false
}: NavbarProps) {
  
  const truncate = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  return (
    <div className="w-full flex justify-center pt-6 px-4 absolute top-0 z-50">
      <nav className="w-full max-w-6xl bg-[var(--bg-charcoal)] border border-[var(--border-subtle)] rounded-full px-4 py-3 flex items-center justify-between shadow-2xl">
        
        {/* Left Side: Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-cyan)] flex items-center justify-center shadow-inner">
            <Zap size={20} className="text-white fill-white" strokeWidth={1} />
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">
            Sentinex<span className="text-[var(--accent-purple)]">.</span>
          </span>
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {isLanding ? (
            <Link href="/app">
              <button className="px-6 py-2.5 rounded-full bg-transparent border border-[var(--border-subtle)] hover:bg-[rgba(255,255,255,0.05)] text-sm font-medium transition-all">
                Launch App
              </button>
            </Link>
          ) : (
            <>
              {!connected ? (
                <button 
                  onClick={onConnect}
                  disabled={connecting}
                  className="px-6 py-2.5 rounded-full bg-[var(--accent-purple)] hover:bg-[#a855f7] text-white text-sm font-semibold shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2)] transition-colors flex items-center gap-2"
                >
                  <Wallet size={16} />
                  {connecting ? "Connecting..." : "Connect Wallet"}
                </button>
              ) : (
                <button 
                  onClick={onDisconnect}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(255,255,255,0.03)] border border-[var(--border-subtle)] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse" />
                  <span className="font-mono text-sm text-[var(--text-muted)] tracking-wide">
                    {walletAddress ? truncate(walletAddress) : ""}
                  </span>
                  <ChevronDown size={16} className="text-[var(--text-dim)] ml-1" />
                </button>
              )}
            </>
          )}
        </div>

      </nav>
    </div>
  );
}
