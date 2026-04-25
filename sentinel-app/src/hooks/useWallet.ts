"use client";

import { useState, useCallback, useEffect } from "react";

interface WalletState {
  address: string | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    connected: false,
    connecting: false,
    error: null,
  });

  const connect = useCallback(async () => {
    setState((s) => ({ ...s, connecting: true, error: null }));

    try {
      // Dynamic import to avoid SSR issues
      const freighter = await import("@stellar/freighter-api");

      const { isConnected } = await freighter.isConnected();
      if (!isConnected) {
        setState((s) => ({
          ...s,
          connecting: false,
          error: "Freighter wallet extension not detected. Please install it.",
        }));
        return;
      }

      const { isAllowed } = await freighter.isAllowed();
      if (!isAllowed) {
        await freighter.setAllowed();
      }

      const { address } = await freighter.getAddress();
      if (address) {
        setState({
          address,
          connected: true,
          connecting: false,
          error: null,
        });
      } else {
        setState((s) => ({
          ...s,
          connecting: false,
          error: "Failed to retrieve wallet address",
        }));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Connection failed";
      setState((s) => ({ ...s, connecting: false, error: message }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      address: null,
      connected: false,
      connecting: false,
      error: null,
    });
  }, []);

  // Check if already connected on mount
  useEffect(() => {
    (async () => {
      try {
        const freighter = await import("@stellar/freighter-api");
        const { isConnected } = await freighter.isConnected();
        const { isAllowed } = await freighter.isAllowed();
        if (isConnected && isAllowed) {
          const { address } = await freighter.getAddress();
          if (address) {
            setState({
              address,
              connected: true,
              connecting: false,
              error: null,
            });
          }
        }
      } catch {
        // silently fail on mount check
      }
    })();
  }, []);

  return { ...state, connect, disconnect };
}
