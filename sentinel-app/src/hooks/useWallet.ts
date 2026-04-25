"use client";

import { useState, useCallback, useEffect } from "react";

export type WalletType = "stellar" | "evm" | null;

interface WalletState {
  address: string | null;
  walletType: WalletType;
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    walletType: null,
    connected: false,
    connecting: false,
    error: null,
  });

  const connectStellar = async () => {
    setState((s) => ({ ...s, connecting: true, error: null }));
    try {
      const freighter = await import("@stellar/freighter-api");
      const { isConnected } = await freighter.isConnected();
      if (!isConnected) throw new Error("Freighter wallet not detected.");

      const { isAllowed } = await freighter.isAllowed();
      if (!isAllowed) await freighter.setAllowed();

      const { address } = await freighter.getAddress();
      if (address) {
        setState({ address, walletType: "stellar", connected: true, connecting: false, error: null });
      } else {
        throw new Error("Failed to get Stellar address");
      }
    } catch (err: any) {
      setState((s) => ({ ...s, connecting: false, error: err.message || "Stellar connection failed" }));
    }
  };

  const connectEVM = async () => {
    setState((s) => ({ ...s, connecting: true, error: null }));
    try {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
        if (accounts.length > 0) {
          setState({ address: accounts[0], walletType: "evm", connected: true, connecting: false, error: null });
        } else {
          throw new Error("No EVM accounts found.");
        }
      } else {
        throw new Error("MetaMask or EVM wallet not detected.");
      }
    } catch (err: any) {
      setState((s) => ({ ...s, connecting: false, error: err.message || "EVM connection failed" }));
    }
  };

  // General connect fallback (defaults to a prompt if we had a modal, but let's default to Freighter for backward compatibility if no arg)
  const connect = useCallback((type: WalletType = "stellar") => {
    if (type === "evm") connectEVM();
    else connectStellar();
  }, []);

  const disconnect = useCallback(() => {
    setState({ address: null, walletType: null, connected: false, connecting: false, error: null });
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
            setState({ address, walletType: "stellar", connected: true, connecting: false, error: null });
            return;
          }
        }
      } catch {}

      // Check EVM
      try {
        if (typeof window !== "undefined" && (window as any).ethereum) {
          const accounts = await (window as any).ethereum.request({ method: "eth_accounts" });
          if (accounts.length > 0) {
            setState({ address: accounts[0], walletType: "evm", connected: true, connecting: false, error: null });
          }
        }
      } catch {}
    })();
  }, []);

  return { ...state, connect, disconnect, connectEVM, connectStellar };
}
