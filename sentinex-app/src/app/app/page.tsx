"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Power, Shield, Scale, Flame, RefreshCw, Smartphone, Wallet } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useWebSocket } from "@/hooks/useWebSocket";
import { api } from "@/lib/api";
import { SentinexState, RiskProfile, TradeExecution } from "@/types";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Mobile wallet input component — allows users to manually enter
 * their Stellar public key on mobile devices where extensions
 * like Freighter aren't available.
 */
function MobileWalletInput({ 
  onConnect, 
  error 
}: { 
  onConnect: (address: string) => void; 
  error: string | null;
}) {
  const [manualAddress, setManualAddress] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect(manualAddress);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
      <div className="relative">
        <input
          type="text"
          value={manualAddress}
          onChange={(e) => setManualAddress(e.target.value)}
          placeholder="G... or 0x..."
          className="w-full bg-[rgba(255,255,255,0.02)] border border-[var(--border-subtle)] rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[var(--accent-purple)] transition-colors text-sm font-mono tracking-wide placeholder:text-[var(--text-dim)]"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <Wallet 
          size={16} 
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" 
        />
      </div>
      <button
        type="submit"
        disabled={!manualAddress.trim()}
        className="w-full px-6 py-4 rounded-xl bg-[var(--accent-purple)] hover:bg-[#a855f7] disabled:opacity-40 disabled:cursor-not-allowed text-white text-base font-semibold shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2)] transition-all flex items-center justify-center gap-2"
      >
        <Wallet size={18} />
        Access Dashboard
      </button>
      <p className="text-[var(--text-dim)] text-[10px] text-center leading-relaxed mt-1">
        Enter your Stellar (G...) or EVM (0x...) wallet address. 
        Your address will be recorded securely.
      </p>
    </form>
  );
}

export default function DashboardApp() {
  const router = useRouter();
  const wallet = useWallet();
  const { logs, connected: wsConnected } = useWebSocket();

  useEffect(() => {
    // Basic frontend gate: if they didn't fill out the form, kick them back
    if (typeof window !== "undefined") {
      if (localStorage.getItem("sentinex_onboarded") !== "true") {
        router.push("/onboarding");
      }
    }
  }, [router]);

  const [sentinexEnabled, setSentinexEnabled] = useState(false);
  const [activeRisk, setActiveRisk] = useState<RiskProfile["label"]>("balanced");
  const [loading, setLoading] = useState(false);

  const toggleSentinex = async () => {
    // Optimistic UI update: flip the switch immediately
    const newState = !sentinexEnabled;
    setSentinexEnabled(newState);
    setLoading(true);

    try {
      if (newState) {
        await api.enableSentinex();
      } else {
        await api.disableSentinex();
      }
    } catch {
      // Revert if API call fails
      setSentinexEnabled(!newState);
    } finally {
      setLoading(false);
    }
  };

  const setRisk = async (profile: RiskProfile["label"]) => {
    setActiveRisk(profile);
    try { await api.setRisk(profile); } catch {}
  };

  const [portfolio, setPortfolio] = useState<{ symbol: string; name: string; balance: string; usd: string; color: string }[]>([]);
  const [totalUsd, setTotalUsd] = useState("$0.00");
  const [news, setNews] = useState<import("@/types").NewsHeadline[]>([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await api.getNews();
        setNews(data);
      } catch {}
    };
    fetchNews();
    const int = setInterval(fetchNews, 5000);
    return () => clearInterval(int);
  }, []);

  useEffect(() => {
    if (!wallet.address) return;

    async function fetchBalances() {
      try {
        const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${wallet.address}`);
        if (!res.ok) throw new Error("Account not found");
        const data = await res.json();
        
        const newPortfolio: any[] = [];
        let totalVal = 0;

        for (const bal of data.balances) {
          if (bal.asset_type === "native") {
            const amount = parseFloat(bal.balance);
            const usd = amount * 0.13; // Mapped XLM price for testnet display
            totalVal += usd;
            newPortfolio.push({
              symbol: "XLM",
              name: "Stellar Lumens",
              balance: amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              usd: `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              color: "bg-white"
            });
          } else {
            const amount = parseFloat(bal.balance);
            let usdPrice = 0;
            let color = "bg-[var(--text-dim)]";
            let name = "Token";
            
            if (bal.asset_code === "USDC") {
              usdPrice = 1.0;
              color = "bg-blue-500";
              name = "USD Coin";
            } else if (bal.asset_code === "AQUA") {
              usdPrice = 0.006;
              color = "bg-cyan-400";
              name = "Aquarius";
            } else if (bal.asset_code === "BTC") {
              usdPrice = 60000.0;
              color = "bg-orange-500";
              name = "Bitcoin";
            } else if (bal.asset_code === "ETH") {
              usdPrice = 3000.0;
              color = "bg-purple-500";
              name = "Ethereum";
            } else if (bal.asset_code === "SOL") {
              usdPrice = 150.0;
              color = "bg-green-500";
              name = "Solana";
            }

            const usd = amount * usdPrice;
            totalVal += usd;
            newPortfolio.push({
              symbol: bal.asset_code,
              name,
              balance: amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              usd: usdPrice > 0 ? `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-",
              color
            });
          }
        }

        // Sort XLM first
        newPortfolio.sort((a, b) => a.symbol === "XLM" ? -1 : b.symbol === "XLM" ? 1 : 0);
        
        setPortfolio(newPortfolio);
        setTotalUsd(`$${totalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      } catch (err) {
        console.error("Failed to fetch balances", err);
        setPortfolio([]);
        setTotalUsd("$0.00");
      }
    }

    fetchBalances();
  }, [wallet.address]);

  return (
    <div className="min-h-screen bg-[var(--bg-obsidian)] relative flex flex-col">
      <Navbar 
        isLanding={false} 
        walletAddress={wallet.address}
        connected={wallet.connected}
        connecting={wallet.connecting}
        onConnect={wallet.connect}
        onDisconnect={wallet.disconnect}
      />

      <main className="flex-1 pt-28 px-4 sm:px-6 max-w-7xl mx-auto w-full pb-20 flex flex-col gap-6 relative z-10">
        
        {/* App State Wrapper */}
        <AnimatePresence mode="wait">
          {!wallet.connected ? (
            <motion.div
              key="disconnected"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center min-h-[60vh]"
            >
              <div className="glass-panel max-w-md w-full p-10 text-center flex flex-col items-center relative overflow-hidden">
                <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-[var(--accent-purple)] rounded-full blur-[80px] opacity-20 pointer-events-none" />
                <div className="absolute bottom-[-50px] left-[-50px] w-32 h-32 bg-[var(--accent-cyan)] rounded-full blur-[80px] opacity-20 pointer-events-none" />

                <div className="w-16 h-16 rounded-full bg-[rgba(255,255,255,0.03)] border border-[var(--border-subtle)] flex items-center justify-center mb-6">
                  {wallet.isMobile ? (
                    <Smartphone size={28} className="text-[var(--text-muted)]" />
                  ) : (
                    <Shield size={28} className="text-[var(--text-muted)]" />
                  )}
                </div>

                <h2 className="text-2xl font-bold mb-3 text-white tracking-tight">
                  {wallet.isMobile ? "Mobile Access" : "Vault Locked"}
                </h2>
                <p className="text-[var(--text-muted)] mb-6 text-sm leading-relaxed">
                  {wallet.isMobile
                    ? "Freighter extension is not available on mobile. Enter your Stellar public key below to access the dashboard."
                    : "Connect your Stellar wallet to view your asset allocations and activate the Sentinex AI Guardian."}
                </p>

                {/* Error Display */}
                {wallet.error && wallet.error !== "MOBILE_NO_EXTENSION" && (
                  <div className="w-full mb-4 px-4 py-3 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-red-400 text-xs text-left">
                    {wallet.error}
                  </div>
                )}

                {wallet.isMobile ? (
                  /* Mobile: Manual address input */
                  <MobileWalletInput 
                    onConnect={wallet.connectManual}
                    error={wallet.error}
                  />
                ) : (
                  /* Desktop: Extension-based connection */
                  <button
                    onClick={() => wallet.connect()}
                    disabled={wallet.connecting}
                    className="w-full px-6 py-4 rounded-xl bg-[var(--accent-purple)] hover:bg-[#a855f7] text-white text-base font-semibold shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2)] transition-all flex items-center justify-center gap-2"
                  >
                    {wallet.connecting ? "Connecting..." : "Connect Wallet to Unlock"}
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="connected"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6 w-full"
            >
              {/* Component A: AI Engine Status (Hero) */}
              <div className="glass-panel w-full relative overflow-hidden flex flex-col items-center justify-center py-16">
                <div 
                  className={`absolute w-[400px] h-[400px] rounded-full blur-[120px] opacity-20 pointer-events-none transition-colors duration-1000 ${
                    sentinexEnabled ? "bg-[var(--accent-cyan)]" : "bg-[var(--accent-purple)]"
                  }`} 
                />
                
                <div className="relative z-10 flex flex-col items-center">
                  {/* Status Indicator */}
                  <div className="relative mb-8">
                    {sentinexEnabled && (
                      <div className="absolute inset-0 rounded-full animate-ping bg-[var(--accent-cyan)] opacity-20" />
                    )}
                    <div 
                      className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-700 ${
                        sentinexEnabled 
                          ? "bg-[rgba(6,182,212,0.1)] shadow-[0_0_40px_rgba(6,182,212,0.4)] border border-[rgba(6,182,212,0.3)] text-[var(--accent-cyan)]" 
                          : "bg-[rgba(255,255,255,0.03)] border border-[var(--border-subtle)] text-[var(--text-muted)]"
                      }`}
                    >
                      <Power size={32} strokeWidth={1.5} />
                    </div>
                  </div>

                  <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
                    {sentinexEnabled ? "Guardian is Active" : "Guardian is Standby"}
                  </h2>
                  
                  {sentinexEnabled && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(6,182,212,0.1)] border border-[rgba(6,182,212,0.2)] mb-4"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] animate-pulse" />
                      <span className="text-[10px] font-bold text-[var(--accent-cyan)] uppercase tracking-widest">Gasless Mode: Active</span>
                    </motion.div>
                  )}

                  <p className="text-[var(--text-muted)] text-sm mb-10 max-w-md text-center">
                    {sentinexEnabled 
                      ? "AI is actively monitoring market sentiment and will execute swaps on your behalf." 
                      : "System is offline. Your vault is secured and awaiting activation."}
                  </p>

                  {/* Master Toggle */}
                  <button 
                    onClick={toggleSentinex}
                    disabled={loading}
                    className={`w-24 h-12 rounded-full relative p-1 ios-switch-track ${
                      sentinexEnabled ? "bg-gradient-to-r from-[var(--accent-cyan)] to-blue-500" : "bg-[rgba(255,255,255,0.1)]"
                    }`}
                  >
                    <div 
                      className={`w-10 h-10 bg-white rounded-full shadow-md ios-switch-thumb ${
                        sentinexEnabled ? "translate-x-12" : "translate-x-0"
                      }`} 
                    />
                  </button>
                </div>
              </div>

              {/* CSS Grid (12 cols) -> Left (5), Right (7) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Component B: Risk Matrix */}
            <div className="glass-panel p-6">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">Risk Matrix</h3>
              
              <div className="flex bg-[rgba(255,255,255,0.03)] p-1 rounded-xl border border-[var(--border-subtle)] mb-4">
                {[
                  { id: "conservative", icon: <Shield size={16} />, label: "Conservative" },
                  { id: "balanced", icon: <Scale size={16} />, label: "Balanced" },
                  { id: "aggressive", icon: <Flame size={16} />, label: "Aggressive" }
                ].map((opt) => {
                  const isActive = activeRisk === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setRisk(opt.id as any)}
                      className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg text-xs font-medium transition-all ${
                        isActive 
                          ? "bg-[var(--bg-charcoal-light)] shadow-sm text-[var(--accent-purple)]" 
                          : "text-[var(--text-dim)] hover:text-[var(--text-muted)]"
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div className="text-xs text-[var(--text-muted)] bg-[rgba(255,255,255,0.02)] p-4 rounded-lg border border-[var(--border-subtle)]">
                {activeRisk === "conservative" && "Max Slippage: 0.5%. Requires 85% LLM confidence. Trades only top 5 liquidity pairs."}
                {activeRisk === "balanced" && "Max Slippage: 1.0%. Requires 65% LLM confidence. Standard asset selection."}
                {activeRisk === "aggressive" && "Max Slippage: 3.0%. Requires 50% LLM confidence. Scans all available Soroban liquidity pools."}
              </div>
            </div>

            {/* Component C: Portfolio Box */}
            <div className="glass-panel p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Allocated Assets</h3>
                <span className="font-mono text-lg font-bold text-white">{totalUsd}</span>
              </div>

              <div className="space-y-3">
                {portfolio.map((asset, idx) => (
                  <div key={`${asset.symbol}-${idx}`} className="flex items-center justify-between p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--border-subtle)]">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${asset.color}`} />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white">{asset.symbol}</span>
                        <span className="text-xs text-[var(--text-dim)]">{asset.name}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-mono text-sm text-white">{asset.balance}</span>
                      <span className="font-mono text-xs text-[var(--text-dim)]">{asset.usd}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (7 cols) */}
          <div className="lg:col-span-7 flex flex-col h-full">
            
            {/* Component D: Execution Terminal */}
            <div className="glass-panel flex flex-col h-[500px] max-h-[500px]">
              
              <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--border-subtle)] bg-[rgba(255,255,255,0.01)]">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Execution Terminal</h3>
                <RefreshCw size={16} className={`text-[var(--accent-cyan)] ${sentinexEnabled ? "animate-spin" : "opacity-50"}`} />
              </div>

              <div className="flex-1 overflow-y-auto terminal-scroll flex flex-col-reverse p-4 bg-[#0a0a0c]">
                <AnimatePresence initial={false}>
                  {[...logs].reverse().map((log, idx) => {
                    // Map generic tags to specific UI styles as requested
                    let tagClass = "log-info";
                    if (log.tag.includes("TRADE")) tagClass = "log-trade";
                    else if (log.tag.includes("SCAN")) tagClass = "log-scan";
                    else if (log.tag.includes("ALERT") || log.tag.includes("ERROR")) tagClass = "log-alert";

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-2 font-mono text-xs"
                      >
                        <div className="text-[var(--text-dim)] mb-1 opacity-60">
                          {new Date(log.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                        </div>
                        <div className="flex items-start gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-widest ${tagClass}`}>
                            {log.tag}
                          </span>
                          <span className="text-[var(--text-muted)] leading-relaxed break-words mt-0.5">
                            {log.message}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {logs.length === 0 && (
                  <div className="text-center text-[var(--text-dim)] font-mono text-xs mt-auto mb-auto">
                    Awaiting telemetry stream...
                  </div>
                )}
              </div>

              <div className="px-4 py-3 border-t border-[var(--border-subtle)] bg-[#050505] rounded-b-2xl flex items-center gap-2">
                <span className="font-mono text-[var(--text-dim)] text-xs">root@sentinex-core:~#</span>
                <div className="w-2 h-3.5 bg-[var(--text-muted)] animate-pulse" />
              </div>

            </div>

            {/* Component E: Live Market News */}
            <div className="glass-panel flex flex-col mt-6 h-[400px] max-h-[400px]">
              <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--border-subtle)] bg-[rgba(255,255,255,0.01)]">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Live Market News</h3>
              </div>
              <div className="p-4 flex flex-col gap-3 overflow-y-auto terminal-scroll">
                {news.length === 0 ? (
                  <div className="text-[var(--text-dim)] text-xs font-mono text-center my-8">Awaiting news stream...</div>
                ) : (
                  news.map((item, idx) => (
                    <a key={idx} href={item.url} target="_blank" rel="noopener noreferrer" className="block p-4 bg-[rgba(255,255,255,0.02)] border border-[var(--border-subtle)] rounded-xl hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--accent-purple)]">{item.source}</span>
                        <span className="text-[10px] text-[var(--text-dim)]">{new Date(item.published_at).toLocaleTimeString()}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mb-2 leading-snug">{item.title}</h4>
                      <div className="flex gap-2">
                        {item.currencies?.map(c => (
                          <span key={c} className="px-1.5 py-0.5 rounded text-[10px] bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)]">{c}</span>
                        ))}
                      </div>
                    </a>
                  ))
                )}
              </div>
            </div>

          </div>

            </div>
          </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
