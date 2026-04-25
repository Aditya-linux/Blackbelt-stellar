"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function OnboardingPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", experience: "beginner" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already onboarded, redirect to app instantly
  useEffect(() => {
    if (localStorage.getItem("sentinel_onboarded") === "true") {
      router.push("/app");
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call to Google Forms / Database
    setTimeout(() => {
      localStorage.setItem("sentinel_onboarded", "true");
      router.push("/app");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-obsidian)] relative flex flex-col items-center justify-center">
      <Navbar isLanding={true} />
      
      {/* Background Orbs */}
      <div className="absolute top-[10%] right-[20%] w-[300px] h-[300px] rounded-full bg-[var(--accent-purple)] blur-[120px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-[10%] left-[20%] w-[300px] h-[300px] rounded-full bg-[var(--accent-cyan)] blur-[120px] opacity-10 pointer-events-none" />

      <main className="relative z-10 w-full max-w-md px-6 pt-24">
        <div className="glass-panel p-8 md:p-10 flex flex-col relative overflow-hidden">
          
          <div className="w-12 h-12 rounded-full bg-[rgba(255,255,255,0.03)] border border-[var(--border-subtle)] flex items-center justify-center mb-6">
            <ShieldCheck size={24} className="text-[var(--accent-cyan)]" />
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Request Early Access</h1>
          <p className="text-[var(--text-muted)] text-sm mb-8 leading-relaxed">
            Sentinel is currently in private beta. Please submit your details to join the whitelist and access the autonomous dashboard.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Full Name
              </label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-[rgba(255,255,255,0.02)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent-purple)] transition-colors text-sm"
                placeholder="Satoshi Nakamoto"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Email Address
              </label>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-[rgba(255,255,255,0.02)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent-purple)] transition-colors text-sm"
                placeholder="satoshi@bitcoin.org"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                DeFi Experience
              </label>
              <select 
                value={formData.experience}
                onChange={(e) => setFormData({...formData, experience: e.target.value})}
                className="w-full bg-[rgba(255,255,255,0.02)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent-purple)] transition-colors text-sm appearance-none"
              >
                <option value="beginner" className="bg-[var(--bg-charcoal)]">Beginner (Just starting)</option>
                <option value="intermediate" className="bg-[var(--bg-charcoal)]">Intermediate (Traded on DEXs)</option>
                <option value="expert" className="bg-[var(--bg-charcoal)]">Expert (Yield Farming, Bots)</option>
              </select>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 px-6 py-4 rounded-xl bg-[var(--accent-purple)] hover:bg-[#a855f7] text-white text-base font-semibold shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2)] transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Securing Access..." : "Join Whitelist"}
              {!isSubmitting && <ChevronRight size={18} />}
            </button>
          </form>

        </div>
      </main>
    </div>
  );
}
