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
    if (localStorage.getItem("sentinex_onboarded") === "true") {
      router.push("/app");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formUrl = "https://docs.google.com/forms/d/e/1FAIpQLScr55kDQmwDk_pbQUCdLJ23h_J0VYCHHrbzhcj5MfMI2nBszQ/formResponse";
    
    // Construct form data using the new Google Form entry IDs
    const submitData = new FormData();
    submitData.append("entry.1522916033", formData.name);       // Full Name
    submitData.append("entry.1078632518", formData.email);      // Email Address
    submitData.append("entry.237006384", "");                   // Wallet Address (filled later on connect)

    // Use case checkbox (pick a sensible default)
    submitData.append("entry.931903387", "Risk Monitoring/Alerts");

    // Rate overall functionality (1-10 scale)
    submitData.append("entry.624241954", "8");

    // Rate platform aspects (grid: each row is a separate entry)
    submitData.append("entry.136069121", "Satisfied");     // Ease of Setting up Protection Rules
    submitData.append("entry.2074921906", "Satisfied");    // Clarity of Risk Reports and Dashboards
    submitData.append("entry.1713952310", "Satisfied");    // Speed and Reliability of Execution
    submitData.append("entry.887526598", "Satisfied");     // User Interface and Experience (UI/UX)

    // Recommend Sentinex (1-5 scale)
    submitData.append("entry.2076904418", "4");

    // Features/improvements (paragraph - optional)
    submitData.append("entry.1700914512", "");

    try {
      await fetch(formUrl, {
        method: "POST",
        mode: "no-cors",
        body: submitData
      });
      
      // Successfully submitted
      localStorage.setItem("sentinex_onboarded", "true");
      router.push("/app");
    } catch (error) {
      console.error("Error submitting to Google Forms:", error);
      setIsSubmitting(false);
      // Fallback: still let them in or show an error
      alert("Failed to join waitlist. Please try again.");
    }
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
            Sentinex is currently in private beta. Please submit your details to join the whitelist and access the autonomous dashboard.
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
