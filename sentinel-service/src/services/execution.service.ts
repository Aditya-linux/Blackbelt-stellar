// ---------------------------------------------------------------------------
// Sentinel Service -- Execution Engine (Stellar SDK / Soroban)
// ---------------------------------------------------------------------------

import * as StellarSdk from "@stellar/stellar-sdk";
import { config } from "../config";
import { SentimentResult, RiskProfile, TradeExecution } from "../types";
import { log } from "../utils/logger";

// Known Stellar testnet asset contract addresses
// In production, these would come from a registry or config
const ASSET_MAP: Record<string, string> = {
  XLM: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC", // native wrapper
  USDC: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",  // testnet USDC
};

const tradeHistory: TradeExecution[] = [];

// Stellar SDK client setup
function getRpcServer(): StellarSdk.SorobanRpc.Server {
  return new StellarSdk.SorobanRpc.Server(config.sorobanRpcUrl);
}

function getAgentKeypair(): StellarSdk.Keypair {
  return StellarSdk.Keypair.fromSecret(config.agentSecret);
}

/**
 * Evaluate sentiment result against risk profile and execute if warranted.
 */
export async function evaluateAndExecute(
  sentiment: SentimentResult,
  riskProfile: RiskProfile
): Promise<TradeExecution | null> {
  // Only act on BUY or SELL signals
  if (sentiment.action === "HOLD") {
    log("[INFO]", `HOLD signal for ${sentiment.asset} -- no action taken`);
    return null;
  }

  // Check confidence threshold
  if (sentiment.confidence < riskProfile.confidence_threshold) {
    log(
      "[INFO]",
      `Confidence ${sentiment.confidence} below threshold ${riskProfile.confidence_threshold} -- skipping`
    );
    return null;
  }

  // Determine trade parameters
  const tradeSize = calculateTradeSize(sentiment, riskProfile);
  const slippageBps = riskProfile.max_slippage_bps;

  log(
    "[TRADE]",
    `Signal accepted: ${sentiment.action} ${sentiment.asset} | Size: ${tradeSize} | Confidence: ${sentiment.confidence}`
  );

  // Build and submit the Soroban transaction
  const execution = await submitSwapTransaction(
    sentiment,
    tradeSize,
    slippageBps
  );

  tradeHistory.push(execution);
  return execution;
}

/**
 * Calculate trade size based on sentiment confidence and risk profile.
 * Higher confidence = larger position within the max_trade_size bounds.
 */
function calculateTradeSize(
  sentiment: SentimentResult,
  riskProfile: RiskProfile
): number {
  // Scale trade size: 30% to 100% of max based on confidence
  const confidenceRatio = sentiment.confidence / 100;
  const scaleFactor = 0.3 + 0.7 * confidenceRatio;
  const size = Math.floor(riskProfile.max_trade_size * scaleFactor);

  return Math.min(size, riskProfile.max_trade_size);
}

/**
 * Construct and submit the Soroban contract invocation for execute_swap.
 */
async function submitSwapTransaction(
  sentiment: SentimentResult,
  tradeSize: number,
  slippageBps: number
): Promise<TradeExecution> {
  const executionId = `trade-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const execution: TradeExecution = {
    id: executionId,
    timestamp: new Date().toISOString(),
    asset: sentiment.asset,
    action: sentiment.action as "BUY" | "SELL",
    amount: tradeSize.toString(),
    confidence: sentiment.confidence,
    sentiment_score: sentiment.sentiment_score,
    tx_hash: null,
    status: "pending",
    log_message: sentiment.log_message,
  };

  try {
    const server = getRpcServer();
    const agentKeypair = getAgentKeypair();
    const agentAccount = await server.getAccount(agentKeypair.publicKey());

    // Determine token_in and token_out based on action
    const tokenIn =
      sentiment.action === "BUY"
        ? ASSET_MAP["USDC"] || ASSET_MAP["XLM"]
        : ASSET_MAP[sentiment.asset] || ASSET_MAP["XLM"];
    const tokenOut =
      sentiment.action === "BUY"
        ? ASSET_MAP[sentiment.asset] || ASSET_MAP["XLM"]
        : ASSET_MAP["USDC"] || ASSET_MAP["XLM"];

    // Calculate min_amount_out with slippage
    const minAmountOut = Math.floor(
      tradeSize * ((10000 - slippageBps) / 10000)
    );

    // Build the Soroban contract call
    const contract = new StellarSdk.Contract(config.contractId);

    const operation = contract.call(
      "execute_swap",
      StellarSdk.Address.fromString(tokenIn).toScVal(),
      StellarSdk.Address.fromString(tokenOut).toScVal(),
      StellarSdk.nativeToScVal(tradeSize, { type: "u128" }),
      StellarSdk.nativeToScVal(minAmountOut, { type: "u128" }),
      StellarSdk.nativeToScVal(sentiment.confidence, { type: "u32" })
    );

    const transaction = new StellarSdk.TransactionBuilder(agentAccount, {
      fee: "100000", // 0.01 XLM
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    // Simulate first
    log("[TRADE]", `Simulating transaction ${executionId}...`);
    const simResponse = await server.simulateTransaction(transaction);

    if (
      StellarSdk.SorobanRpc.Api.isSimulationError(simResponse)
    ) {
      const errMsg =
        "error" in simResponse
          ? String(simResponse.error)
          : "Simulation failed";
      throw new Error(`Simulation error: ${errMsg}`);
    }

    // Prepare (assemble) the transaction with simulation results
    const preparedTx = StellarSdk.SorobanRpc.assembleTransaction(
      transaction,
      simResponse as StellarSdk.SorobanRpc.Api.SimulateTransactionSuccessResponse
    ).build();

    // Sign with agent key
    preparedTx.sign(agentKeypair);

    // Submit
    log("[TRADE]", `Submitting transaction ${executionId} to Stellar Testnet...`);
    const sendResponse = await server.sendTransaction(preparedTx);

    if (sendResponse.status === "ERROR") {
      throw new Error(`Submit error: ${sendResponse.status}`);
    }

    execution.tx_hash = sendResponse.hash;
    execution.status = "submitted";

    log(
      "[TRADE]",
      `Transaction submitted: ${sendResponse.hash}`
    );

    // Poll for confirmation
    let confirmed = false;
    for (let i = 0; i < 10; i++) {
      await sleep(3000);
      const txResult = await server.getTransaction(sendResponse.hash);
      if (txResult.status === "SUCCESS") {
        execution.status = "confirmed";
        confirmed = true;
        log(
          "[TRADE]",
          `Transaction confirmed: ${sendResponse.hash}`
        );
        break;
      } else if (txResult.status === "FAILED") {
        execution.status = "failed";
        log("[ERROR]", `Transaction failed on-chain: ${sendResponse.hash}`);
        break;
      }
    }

    if (!confirmed && execution.status === "submitted") {
      log("[ALERT]", `Transaction confirmation timeout: ${sendResponse.hash}`);
    }
  } catch (error: any) {
    execution.status = "failed";
    log("[ERROR]", `Trade execution failed: ${error.message}`);
  }

  return execution;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getTradeHistory(): TradeExecution[] {
  return [...tradeHistory];
}
