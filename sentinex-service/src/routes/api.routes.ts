// ---------------------------------------------------------------------------
// Sentinex Service -- REST API Routes
// ---------------------------------------------------------------------------

import { Router, Request, Response } from "express";
import { RISK_PRESETS, RiskProfile, SentinexState } from "../types";
import { getLogHistory } from "../utils/logger";
import { getTradeHistory } from "../services/execution.service";

const router = Router();

// Shared state (mutated by the orchestrator in index.ts)
let currentState: SentinexState = {
  status: "sleeping",
  last_scan: null,
  active_risk_profile: RISK_PRESETS.balanced,
  total_trades: 0,
  uptime_seconds: 0,
};

let latestNews: import("../types").NewsHeadline[] = [];

const startTime = Date.now();

export function updateState(partial: Partial<SentinexState>): void {
  currentState = { ...currentState, ...partial };
}

export function updateLatestNews(news: import("../types").NewsHeadline[]): void {
  latestNews = news;
}

export function getState(): SentinexState {
  return {
    ...currentState,
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
  };
}

// GET /api/status -- current Sentinex state
router.get("/status", (_req: Request, res: Response) => {
  res.json({ ok: true, data: getState() });
});

// GET /api/news -- latest market news
router.get("/news", (_req: Request, res: Response) => {
  res.json({ ok: true, data: latestNews });
});

// GET /api/logs -- recent log history
router.get("/logs", (_req: Request, res: Response) => {
  const limit = parseInt((_req.query.limit as string) || "50", 10);
  const logs = getLogHistory().slice(-limit);
  res.json({ ok: true, data: logs });
});

// GET /api/trades -- trade execution history
router.get("/trades", (_req: Request, res: Response) => {
  res.json({ ok: true, data: getTradeHistory() });
});

// GET /api/risk-presets -- available risk profiles
router.get("/risk-presets", (_req: Request, res: Response) => {
  res.json({ ok: true, data: RISK_PRESETS });
});

// POST /api/risk -- update active risk profile
router.post("/risk", (req: Request, res: Response) => {
  const { profile } = req.body;

  if (!profile || !RISK_PRESETS[profile as keyof typeof RISK_PRESETS]) {
    res.status(400).json({
      ok: false,
      error: "Invalid profile. Must be: conservative, balanced, or aggressive",
    });
    return;
  }

  const riskProfile = RISK_PRESETS[profile as keyof typeof RISK_PRESETS];
  updateState({ active_risk_profile: riskProfile });

  res.json({ ok: true, data: riskProfile });
});

import { triggerManualScan } from "../index";

// POST /api/sentinex/enable -- start the scanning loop
router.post("/sentinex/enable", (_req: Request, res: Response) => {
  updateState({ status: "analyzing" });
  res.json({ ok: true, message: "Sentinex enabled" });
  
  // Trigger an immediate scan so the user doesn't have to wait 10 seconds to see action
  triggerManualScan();
});

// POST /api/sentinex/disable -- pause the scanning loop
router.post("/sentinex/disable", (_req: Request, res: Response) => {
  updateState({ status: "sleeping" });
  res.json({ ok: true, message: "Sentinex disabled" });
});

export default router;
