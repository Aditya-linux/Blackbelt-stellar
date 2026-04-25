// ---------------------------------------------------------------------------
// Sentinel Service -- Main Entry Point
// ---------------------------------------------------------------------------

import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";
import cron from "node-cron";

import { config } from "./config";
import apiRoutes, { getState, updateState } from "./routes/api.routes";
import { attachWebSocket, log } from "./utils/logger";
import { fetchNewsHeadlines } from "./services/news.service";
import { analyzeSentiment } from "./services/sentiment.service";
import { evaluateAndExecute } from "./services/execution.service";

// ---------------------------------------------------------------------------
// Express + HTTP Server
// ---------------------------------------------------------------------------
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use("/api", apiRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "sentinel-service", version: "1.0.0" });
});

const server = http.createServer(app);

// ---------------------------------------------------------------------------
// WebSocket Server (for live log streaming to frontend)
// ---------------------------------------------------------------------------
const wss = new WebSocketServer({ server, path: "/ws" });
attachWebSocket(wss);

// ---------------------------------------------------------------------------
// Sentinel Scan Loop
// ---------------------------------------------------------------------------
async function runScanCycle(): Promise<void> {
  const state = getState();

  // Only run if sentinel is enabled (not sleeping)
  if (state.status === "sleeping") {
    return;
  }

  try {
    updateState({ status: "analyzing" });
    log("[SCAN]", "--- Sentinel scan cycle initiated ---");

    // Step 1: Fetch news
    const headlines = await fetchNewsHeadlines();

    // Step 2: Analyze sentiment
    const sentiment = await analyzeSentiment(headlines);

    if (!sentiment) {
      log("[INFO]", "No actionable sentiment -- cycle complete");
      updateState({
        status: "analyzing",
        last_scan: new Date().toISOString(),
      });
      return;
    }

    // Step 3: Evaluate against risk profile and execute if warranted
    if (sentiment.action !== "HOLD") {
      updateState({ status: "executing" });
      log(
        "[TRADE]",
        `Evaluating ${sentiment.action} signal for ${sentiment.asset}...`
      );

      const trade = await evaluateAndExecute(
        sentiment,
        state.active_risk_profile
      );

      if (trade) {
        updateState({
          total_trades: state.total_trades + 1,
        });
        log(
          "[TRADE]",
          `Cycle complete: ${trade.status} | TX: ${trade.tx_hash || "N/A"}`
        );
      }
    }

    updateState({
      status: "analyzing",
      last_scan: new Date().toISOString(),
    });
    log("[SCAN]", "--- Scan cycle complete ---");
  } catch (error: any) {
    log("[ERROR]", `Scan cycle error: ${error.message}`);
    updateState({ status: "analyzing" });
  }
}

// ---------------------------------------------------------------------------
// Cron Scheduler
// ---------------------------------------------------------------------------
// Run scan every N seconds (configured via SCAN_INTERVAL_SECONDS)
const intervalMinutes = Math.max(1, Math.ceil(config.scanIntervalSeconds / 60));
const cronExpression = `*/${intervalMinutes} * * * *`;

cron.schedule(cronExpression, () => {
  runScanCycle().catch((err) => {
    log("[ERROR]", `Unhandled scan error: ${err.message}`);
  });
});

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------
server.listen(config.port, () => {
  log("[SYSTEM]", `Sentinel Service running on port ${config.port}`);
  log("[SYSTEM]", `WebSocket endpoint: ws://localhost:${config.port}/ws`);
  log("[SYSTEM]", `REST API: http://localhost:${config.port}/api`);
  log(
    "[SYSTEM]",
    `Scan interval: ${config.scanIntervalSeconds}s (cron: ${cronExpression})`
  );
  log("[INFO]", "Sentinel is SLEEPING -- awaiting activation from frontend");
});

export { app, server };
