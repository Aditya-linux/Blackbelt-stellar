// ---------------------------------------------------------------------------
// Sentinex Service -- Configuration
// ---------------------------------------------------------------------------

import dotenv from "dotenv";
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) {
    console.error(`[SYSTEM] Missing required env var: ${key}`);
    process.exit(1);
  }
  return val;
}

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),

  // OpenAI
  openaiApiKey: required("OPENAI_API_KEY"),

  // News
  cryptoPanicApiKey: required("CRYPTOPANIC_API_KEY"),

  // Stellar
  stellarNetwork: process.env.STELLAR_NETWORK || "testnet",
  horizonUrl:
    process.env.STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org",
  sorobanRpcUrl:
    process.env.STELLAR_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org",

  // Contract
  contractId: required("SOROBAN_CONTRACT_ID"),

  // Agent keys
  agentSecret: required("STELLAR_AGENT_SECRET"),
  agentAddress: required("STELLAR_AGENT_ADDRESS"),
  ownerAddress: process.env.STELLAR_OWNER_ADDRESS || "",

  // Defaults
  defaultConfidenceThreshold: parseInt(
    process.env.DEFAULT_CONFIDENCE_THRESHOLD || "65",
    10
  ),
  scanIntervalSeconds: parseInt(
    process.env.SCAN_INTERVAL_SECONDS || "120",
    10
  ),
} as const;
