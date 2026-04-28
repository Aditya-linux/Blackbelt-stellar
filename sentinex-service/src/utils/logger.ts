// ---------------------------------------------------------------------------
// Sentinex Service -- Structured Logger with WebSocket broadcast
// ---------------------------------------------------------------------------

import { WebSocketServer, WebSocket } from "ws";
import { LogEntry } from "../types";

let wss: WebSocketServer | null = null;
const logHistory: LogEntry[] = [];
const MAX_HISTORY = 200;

export function attachWebSocket(server: WebSocketServer): void {
  wss = server;

  wss.on("connection", (ws: WebSocket) => {
    // Send recent log history on connect
    const recent = logHistory.slice(-50);
    ws.send(JSON.stringify({ type: "history", logs: recent }));
  });
}

function broadcast(entry: LogEntry): void {
  logHistory.push(entry);
  if (logHistory.length > MAX_HISTORY) {
    logHistory.shift();
  }

  if (!wss) return;

  const payload = JSON.stringify({ type: "log", entry });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

export function log(
  tag: LogEntry["tag"],
  message: string
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    tag,
    message,
  };

  // Console output
  const prefix = `${entry.timestamp} ${tag}`;
  switch (tag) {
    case "[ERROR]":
      console.error(`${prefix} ${message}`);
      break;
    case "[ALERT]":
      console.warn(`${prefix} ${message}`);
      break;
    default:
      console.log(`${prefix} ${message}`);
  }

  // Broadcast to connected WebSocket clients
  broadcast(entry);
}

export function getLogHistory(): LogEntry[] {
  return [...logHistory];
}
