// ---------------------------------------------------------------------------
// Sentinel Service -- News Ingestion (Yahoo Finance API)
// ---------------------------------------------------------------------------

import { NewsHeadline } from "../types";
import { log } from "../utils/logger";

const YAHOO_FINANCE_URL = "https://query2.finance.yahoo.com/v1/finance/search?q=crypto&newsCount=10";

// Fallback headlines for when the API is unavailable or rate-limited
const FALLBACK_HEADLINES: NewsHeadline[] = [
  {
    title: "Stellar Foundation announces new DeFi liquidity incentive program",
    source: "CoinDesk",
    url: "https://coindesk.com",
    published_at: new Date().toISOString(),
    currencies: ["XLM"],
  },
  {
    title: "USDC stablecoin volume surges on Stellar network",
    source: "The Block",
    url: "https://theblock.co",
    published_at: new Date().toISOString(),
    currencies: ["XLM", "USDC"],
  },
  {
    title: "DeFi total value locked reaches new quarterly high",
    source: "DeFi Pulse",
    url: "https://defipulse.com",
    published_at: new Date().toISOString(),
    currencies: ["XLM"],
  },
];

export async function fetchNewsHeadlines(): Promise<NewsHeadline[]> {
  try {
    log("[SCAN]", "Fetching latest crypto headlines from Yahoo Finance...");

    const response = await fetch(YAHOO_FINANCE_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      log(
        "[ALERT]",
        `Yahoo Finance API returned ${response.status} -- using fallback headlines`
      );
      return FALLBACK_HEADLINES;
    }

    const data: any = await response.json();

    if (!data.news || data.news.length === 0) {
      log("[INFO]", "No headlines returned -- using fallback data");
      return FALLBACK_HEADLINES;
    }

    const headlines: NewsHeadline[] = data.news.map((item: any) => ({
      title: item.title || "",
      source: item.publisher || "Yahoo Finance",
      url: item.link || "",
      published_at: item.providerPublishTime 
        ? new Date(item.providerPublishTime * 1000).toISOString() 
        : new Date().toISOString(),
      currencies: ["XLM", "CRYPTO"],
    }));

    log("[SCAN]", `Fetched ${headlines.length} headlines from Yahoo Finance`);
    return headlines;
  } catch (error: any) {
    log(
      "[ERROR]",
      `News fetch failed: ${error.message} -- using fallback headlines`
    );
    return FALLBACK_HEADLINES;
  }
}
