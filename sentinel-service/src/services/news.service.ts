// ---------------------------------------------------------------------------
// Sentinel Service -- News Ingestion (CryptoPanic API)
// ---------------------------------------------------------------------------

import { config } from "../config";
import { NewsHeadline } from "../types";
import { log } from "../utils/logger";

const CRYPTOPANIC_BASE = "https://cryptopanic.com/api/v1/posts/";

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
    log("[SCAN]", "Fetching latest crypto headlines from CryptoPanic...");

    const params = new URLSearchParams({
      auth_token: config.cryptoPanicApiKey,
      currencies: "XLM",
      filter: "hot",
      public: "true",
    });

    const response = await fetch(`${CRYPTOPANIC_BASE}?${params.toString()}`);

    if (!response.ok) {
      log(
        "[ALERT]",
        `CryptoPanic API returned ${response.status} -- using fallback headlines`
      );
      return FALLBACK_HEADLINES;
    }

    const data = (await response.json()) as {
      results?: Array<{
        title?: string;
        source?: { title?: string };
        url?: string;
        published_at?: string;
        currencies?: Array<{ code: string }>;
      }>;
    };

    if (!data.results || data.results.length === 0) {
      log("[INFO]", "No headlines returned -- using fallback data");
      return FALLBACK_HEADLINES;
    }

    const headlines: NewsHeadline[] = data.results
      .slice(0, 10)
      .map((item: any) => ({
        title: item.title || "",
        source: item.source?.title || "Unknown",
        url: item.url || "",
        published_at: item.published_at || new Date().toISOString(),
        currencies: item.currencies?.map((c: any) => c.code) || ["XLM"],
      }));

    log("[SCAN]", `Fetched ${headlines.length} headlines for analysis`);
    return headlines;
  } catch (error: any) {
    log(
      "[ERROR]",
      `News fetch failed: ${error.message} -- using fallback headlines`
    );
    return FALLBACK_HEADLINES;
  }
}
