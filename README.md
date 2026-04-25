# Sentinel: Autonomous Non-Custodial DeFi Guardian
**Blue and Black Belt Submission for Stellar RiseIn**

<div align="center">
  <img src="https://img.shields.io/badge/Stellar-Network-black?style=for-the-badge&logo=stellar" alt="Stellar" />
  <img src="https://img.shields.io/badge/Soroban-Smart_Contracts-purple?style=for-the-badge" alt="Soroban" />
  <img src="https://img.shields.io/badge/Next.js-Frontend-blue?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Node.js-AI_Backend-green?style=for-the-badge&logo=node.js" alt="Node.js" />
</div>

## 🔗 Live On-Chain Verification
**Want to see the AI Agent actually executing trades on the blockchain in real-time?** 

Because the AI Agent is funded and hard-coded to make real transactions on the Stellar Testnet, you can look at the Agent's public ledger profile right now. Click below to see the AI Agent's live wallet and watch every single transaction it evaluates pop up in real-time:

👉 **[View the AI Agent's Live Ledger Profile on Stellar Expert](https://stellar.expert/explorer/testnet/account/GDMNG2E6CZOCQRX3EZXDRDGCK2XVTVZNCJ3H4CPEHKSFUFVFGKN6GJ73)**

*(If you let the dashboard run for a few minutes, you will see this ledger filling up with "Payment" operations every time the AI executes a trade!)*

## 🧪 Validator / Judge Testing Guide
**Want to test the platform yourself? Follow these steps:**
1. **Onboarding:** Visit the live Vercel deployment link and fill out the Waitlist form. (This proves our seamless Next.js to Google Forms No-CORS integration).
   * 👉 **[View Live Form Responses Here]([https://docs.google.com/forms/d/1_MTa3O0jbIq5GJE-ZuzbE8PHrPoKInZJWk14bSDkMWg/edit#responses](https://docs.google.com/spreadsheets/d/1I-17ApYCyLLkOlDM0oE6TkSvo_Vcz4sqYl3lUdYOB5c/edit?resourcekey=&gid=832346859#gid=832346859))** *(Note: Requires owner permission)*
2. **Wallet Connection:** Connect your Stellar Freighter Wallet on the testnet. You will see the UI immediately fetch and display your live XLM balances.
3. **Activate the AI:** Scroll down to the Execution Terminal and click **"Activate Guardian"**.
4. **Watch the Magic:** You will see the Node.js backend instantly begin scraping live Yahoo Finance news, running it through the AI sentiment engine, and streaming the results back to the frontend via WebSockets.
5. **Verify the Trade:** Wait for the AI to execute a trade. It will output a transaction hash in the terminal. Copy that hash and paste it into [Stellar Expert](https://stellar.expert/explorer/testnet) to verify the real on-chain execution!

## 📖 About The Project
Sentinel is an autonomous, AI-driven, and purely non-custodial DeFi dashboard built natively on the Stellar network using Soroban smart contracts. It acts as an automated "Guardian" for a user's cryptocurrency portfolio. Once activated, the Sentinel AI continuously monitors global financial news via the CryptoPanic API and LLM sentiment analysis. When it detects significant market-moving events, it autonomously executes optimal trades to capture upside or protect assets—all without human intervention.

## ⚠️ The Problem
The cryptocurrency market operates 24/7 and moves at the speed of light. Human traders cannot realistically monitor Twitter, news feeds, and charts constantly to react to sudden exploits or breaking partnerships. 

Historically, to automate trading, users had to rely on **Custodial Trading Bots**. This required handing over private keys or exchange API keys to a centralized server. If that server was hacked or acted maliciously, the user's entire portfolio was drained.

## 🛡️ The Solution: Solving the "Trust" Problem
As a user, why is this project interesting? **Sentinel solves the biggest problem in AI Crypto Trading: Trust.**

Currently, if you want an AI to trade for you, you must give a Python server your wallet's Private Keys. If that AI gets hacked, hallucinates, or goes rogue, your entire wallet gets drained. It is incredibly dangerous.

**The "Sentinel Vault" Architecture fixes this completely:**
1. **100% Non-Custodial:** You deposit your funds into the Soroban Smart Contract. You are the *only person* on earth who can withdraw them.
2. **Restricted AI Execution:** You grant the AI Agent a restricted "Execute Swap Only" permission. It physically cannot withdraw or transfer your money.
3. **The 7-Gate Risk Matrix:** Even when the AI tries to execute a swap, the Soroban Smart Contract enforces your risk profile *on-chain*. The contract checks the AI's requested slippage, trade size, daily frequency, and confidence scores. 
4. **Blockchain as the Ultimate Guardian:** If the AI hallucinates and tries to dump 100% of your portfolio into a scam coin, the Soroban blockchain mathematically rejects the transaction.

*Sentinel gives regular users the power of a 24/7 autonomous Wall Street hedge fund, combined with the impenetrable security of a cold wallet.*

## 🚀 Key Features
*   **Phantom-Inspired UI/UX:** A highly polished, premium dark-mode interface featuring dynamic glassmorphism and real-time telemetry.
*   **Live Horizon Integration:** Automatically fetches and displays real-time testnet balances and portfolio allocations upon wallet connection.
*   **Live Execution Terminal:** A transparent, color-coded WebSocket feed showing the AI's real-time thought process, news scanning, and trade execution.
*   **Dynamic Risk Matrix:** Users can toggle between Conservative, Balanced, and Aggressive profiles, which dynamically updates the Soroban smart contract parameters.
*   **Integrated Onboarding:** A seamless pre-dashboard intercept form to collect waitlist data before unlocking the application.

## 🗺️ User Flow
1. **Onboarding:** The user arrives at the landing page and clicks "Connect Wallet". They are intercepted by a beautifully designed waitlist form to capture user data.
2. **Wallet Authentication:** Upon form submission, the user connects their Stellar Freighter Wallet.
3. **Dashboard Initialization:** The dashboard queries the Stellar Horizon API to fetch the user's real-time token balances and calculates their USD portfolio value.
4. **Risk Configuration:** The user selects their desired Risk Matrix (Conservative, Balanced, Aggressive).
5. **Guardian Activation:** The user clicks "Activate Guardian", initiating a WebSocket connection to the Node.js AI Backend.
6. **Autonomous Trading:** The AI backend scans breaking news, runs sentiment analysis via LLMs, and streams its thought process to the frontend Execution Terminal. If a threshold is met, it executes a trade on Soroban.

## 🏗️ Architecture Stack
*   **Frontend:** Next.js 14, React, Tailwind CSS, Framer Motion, Lucide Icons.
*   **Backend:** Node.js, Express, WebSockets, TypeScript.
*   **AI Engine:** CryptoPanic API (News Ingestion), OpenAI API (Sentiment Analysis).
*   **Blockchain:** Stellar Horizon API (Data fetching), Soroban/Rust (Smart Contracts).

## 🛠️ Local Development

### 1. Sentinel App (Frontend)
```bash
cd sentinel-app
npm install
npm run dev
```

### 2. Sentinel Service (AI Backend)
```bash
cd sentinel-service
npm install
npm run dev
```

### 3. Sentinel Vault (Soroban Contracts)
```bash
cd sentinel-vault
cargo build --target wasm32-unknown-unknown --release
```
