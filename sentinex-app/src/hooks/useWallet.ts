"use client";

import { useState, useCallback, useEffect } from "react";

export type WalletType = "stellar" | "evm" | "manual" | null;

interface WalletState {
  address: string | null;
  walletType: WalletType;
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

/**
 * Detects if the current device is a mobile browser.
 */
function isMobileBrowser(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Submits the wallet address to the Google Form/Sheet.
 * Uses the dedicated "Primary Wallet Address" field (entry.237006384)
 * in the new Google Form so wallet addresses get their own column.
 */
async function submitWalletToSheet(address: string): Promise<void> {
  const formUrl =
    "https://docs.google.com/forms/d/e/1FAIpQLScr55kDQmwDk_pbQUCdLJ23h_J0VYCHHrbzhcj5MfMI2nBszQ/formResponse";

  const submitData = new FormData();
  // Full Name — mark as auto wallet-connect submission
  submitData.append("entry.1522916033", `[WALLET-CONNECT]`);
  // Email — placeholder for wallet-only entries
  submitData.append("entry.1078632518", `wallet-connect@sentinex.app`);
  // Wallet Address — the dedicated field
  submitData.append("entry.237006384", address);

  // Provide sensible defaults for the remaining required fields
  submitData.append("entry.931903387", "Automated Strategy Execution"); // Use case
  submitData.append("entry.624241954", "8");        // Overall rating (1-10)
  submitData.append("entry.136069121", "Satisfied"); // Ease of setup
  submitData.append("entry.2074921906", "Satisfied"); // Clarity of reports
  submitData.append("entry.1713952310", "Satisfied"); // Speed & reliability
  submitData.append("entry.887526598", "Satisfied");  // UI/UX
  submitData.append("entry.2076904418", "4");        // Recommend (1-5)
  submitData.append("entry.1700914512", "");         // Features (optional)

  try {
    await fetch(formUrl, {
      method: "POST",
      mode: "no-cors",
      body: submitData,
    });
    console.log("[Sentinex] Wallet address submitted to sheet:", address);
  } catch (err) {
    console.error("[Sentinex] Failed to submit wallet address to sheet:", err);
  }
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    walletType: null,
    connected: false,
    connecting: false,
    error: null,
  });

  // Track whether we're on mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(isMobileBrowser());
  }, []);

  const connectStellar = async () => {
    setState((s) => ({ ...s, connecting: true, error: null }));
    try {
      // On mobile, Freighter extension is not available.
      // Redirect user to manual input flow.
      if (isMobileBrowser()) {
        throw new Error(
          "MOBILE_NO_EXTENSION"
        );
      }

      const freighter = await import("@stellar/freighter-api");
      const { isConnected } = await freighter.isConnected();
      if (!isConnected) throw new Error("Freighter wallet not detected. Please install the Freighter extension.");

      const { isAllowed } = await freighter.isAllowed();
      if (!isAllowed) await freighter.setAllowed();

      const { address } = await freighter.getAddress();
      if (address) {
        setState({ address, walletType: "stellar", connected: true, connecting: false, error: null });
        // Submit wallet address to Google Sheet
        submitWalletToSheet(address);
      } else {
        throw new Error("Failed to get Stellar address");
      }
    } catch (err: any) {
      if (err.message === "MOBILE_NO_EXTENSION") {
        // Don't set an error — the UI will handle mobile mode
        setState((s) => ({ ...s, connecting: false, error: "MOBILE_NO_EXTENSION" }));
      } else {
        setState((s) => ({ ...s, connecting: false, error: err.message || "Stellar connection failed" }));
      }
    }
  };

  const connectEVM = async () => {
    setState((s) => ({ ...s, connecting: true, error: null }));
    try {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
        if (accounts.length > 0) {
          setState({ address: accounts[0], walletType: "evm", connected: true, connecting: false, error: null });
          // Submit wallet address to Google Sheet
          submitWalletToSheet(accounts[0]);
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

  /**
   * Connect with a manually entered Stellar public key.
   * Used on mobile where extensions are unavailable.
   */
  const connectManual = useCallback((manualAddress: string) => {
    if (!manualAddress || manualAddress.length < 10) {
      setState((s) => ({ ...s, error: "Please enter a valid Stellar public key" }));
      return;
    }

    // Basic Stellar address validation (starts with G, 56 chars)
    const isValidStellar = /^G[A-Z2-7]{55}$/.test(manualAddress.trim());
    // Basic EVM address validation (starts with 0x, 42 chars)
    const isValidEVM = /^0x[a-fA-F0-9]{40}$/.test(manualAddress.trim());

    if (!isValidStellar && !isValidEVM) {
      setState((s) => ({ ...s, error: "Invalid wallet address format. Enter a Stellar (G...) or EVM (0x...) address." }));
      return;
    }

    const walletType: WalletType = isValidStellar ? "stellar" : "evm";
    const trimmedAddress = manualAddress.trim();

    setState({
      address: trimmedAddress,
      walletType,
      connected: true,
      connecting: false,
      error: null,
    });

    // Submit wallet address to Google Sheet
    submitWalletToSheet(trimmedAddress);
  }, []);

  // General connect fallback
  const connect = useCallback((type: WalletType = "stellar") => {
    if (type === "evm") connectEVM();
    else connectStellar();
  }, [isMobile]);

  const disconnect = useCallback(() => {
    setState({ address: null, walletType: null, connected: false, connecting: false, error: null });
  }, []);

  // Check if already connected on mount
  useEffect(() => {
    (async () => {
      // Skip Freighter auto-reconnect on mobile
      if (!isMobileBrowser()) {
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
      }

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

  return { ...state, isMobile, connect, disconnect, connectEVM, connectStellar, connectManual };
}
