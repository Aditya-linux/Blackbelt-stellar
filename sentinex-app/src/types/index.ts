export interface NewsHeadline {
  title: string;
  source: string;
  url: string;
  published_at: string;
  currencies?: string[];
}

export interface SentimentResult {
  asset: string;
  sentiment_score: number;
  action: "BUY" | "SELL" | "HOLD";
  confidence: number;
  log_message: string;
}

export interface RiskProfile {
  label: "conservative" | "balanced" | "aggressive";
  confidence_threshold: number;
  max_slippage_bps: number;
  max_trade_size: number;
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

export type SentinexStatus = "sleeping" | "analyzing" | "executing";

export interface SentinexState {
  status: SentinexStatus;
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
