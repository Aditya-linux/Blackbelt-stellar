let API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
if (API_BASE.endsWith("/")) API_BASE = API_BASE.slice(0, -1);

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "API request failed");
  return json.data as T;
}

export const api = {
  getStatus: () => request<import("@/types").SentinelState>("/api/status"),
  getLogs: (limit = 50) => request<import("@/types").LogEntry[]>(`/api/logs?limit=${limit}`),
  getTrades: () => request<import("@/types").TradeExecution[]>("/api/trades"),
  getNews: () => request<import("@/types").NewsHeadline[]>("/api/news"),
  getRiskPresets: () => request<Record<string, import("@/types").RiskProfile>>("/api/risk-presets"),
  setRisk: (profile: string) =>
    request<import("@/types").RiskProfile>("/api/risk", {
      method: "POST",
      body: JSON.stringify({ profile }),
    }),
  enableSentinel: () =>
    request<{ message: string }>("/api/sentinel/enable", { method: "POST" }),
  disableSentinel: () =>
    request<{ message: string }>("/api/sentinel/disable", { method: "POST" }),
};

export function getWsUrl(): string {
  let base = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
  if (base.endsWith("/")) base = base.slice(0, -1);
  return `${base}/ws`;
}
