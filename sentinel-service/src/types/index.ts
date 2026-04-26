// ---------------------------------------------------------------------------
// Sentinex Service -- Type Definitions
// ---------------------------------------------------------------------------

export interface SentimentResult {
  asset: string;
  sentiment_score: number;  // 1-100
  action: "BUY" | "SELL" | "HOLD";
  confidence: number;       // 1-100
  log_message: string;
}

export interface NewsHeadline {
  title: string;
  source: string;
  url: string;
  published_at: string;
  currencies?: string[];
}

export interface RiskProfile {
  label: "conservative" | "balanced" | "aggressive";
  confidence_threshold: number;
  max_slippage_bps: number;
  max_trade_size: number;     // in stroops (7 decimals)
  max_daily_trades: number;
}

export interface TradeExecution {
  id: string;
  timestamp: string;
  asset: string;
  action: "BUY" | "SELL";
  amount: string;
  confidence: number;
  sentiment_score: number;
  tx_hash: string | null;
  status: "pending" | "submitted" | "confirmed" | "failed";
  log_message: string;
}

export interface SentinexState {
  status: "sleeping" | "analyzing" | "executing";
  last_scan: string | null;
  active_risk_profile: RiskProfile;
  total_trades: number;
  uptime_seconds: number;
}

export interface LogEntry {
  timestamp: string;
  tag: "[INFO]" | "[SCAN]" | "[TRADE]" | "[ALERT]" | "[ERROR]" | "[SYSTEM]";
  message: string;
}

export const RISK_PRESETS: Record<RiskProfile["label"], RiskProfile> = {
  conservative: {
    label: "conservative",
    confidence_threshold: 85,
    max_slippage_bps: 30,
    max_trade_size: 500_0000000,
    max_daily_trades: 3,
  },
  balanced: {
    label: "balanced",
    confidence_threshold: 65,
    max_slippage_bps: 100,
    max_trade_size: 2000_0000000,
    max_daily_trades: 10,
  },
  aggressive: {
    label: "aggressive",
    confidence_threshold: 40,
    max_slippage_bps: 250,
    max_trade_size: 10000_0000000,
    max_daily_trades: 25,
  },
};
