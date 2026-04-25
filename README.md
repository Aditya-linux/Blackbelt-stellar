# Sentinel: Autonomous Non-Custodial DeFi Guardian
**Blue and Black Belt Submission for Stellar RiseIn**

<div align="center">
  <img src="https://img.shields.io/badge/Stellar-Network-black?style=for-the-badge&logo=stellar" alt="Stellar" />
  <img src="https://img.shields.io/badge/Soroban-Smart_Contracts-purple?style=for-the-badge" alt="Soroban" />
  <img src="https://img.shields.io/badge/Next.js-Frontend-blue?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Node.js-AI_Backend-green?style=for-the-badge&logo=node.js" alt="Node.js" />
</div>

## 📖 About The Project
Sentinel is an autonomous, AI-driven, and purely non-custodial DeFi dashboard built natively on the Stellar network using Soroban smart contracts. It acts as an automated "Guardian" for a user's cryptocurrency portfolio. Once activated, the Sentinel AI continuously monitors global financial news via the CryptoPanic API and LLM sentiment analysis. When it detects significant market-moving events, it autonomously executes optimal trades to capture upside or protect assets—all without human intervention.

## ⚠️ The Problem
The cryptocurrency market operates 24/7 and moves at the speed of light. Human traders cannot realistically monitor Twitter, news feeds, and charts constantly to react to sudden exploits or breaking partnerships. 

Historically, to automate trading, users had to rely on **Custodial Trading Bots**. This required handing over private keys or exchange API keys to a centralized server. If that server was hacked or acted maliciously, the user's entire portfolio was drained.

## 🛡️ The Solution (Non-Custodial Automation)
Sentinel solves this by combining Large Language Models (LLMs) with mathematical non-custodial Smart Contracts:
*   **Zero Custody:** Users lock their funds in a Soroban Vault. The user always retains 100% ownership and withdrawal rights.
*   **Mathematical Boundaries (7-Gate Security):** The user grants an "Agent Key" (the AI) permission to trade on their behalf, but sets rigid boundaries (e.g., maximum slippage of 1%, specific approved assets, max daily trades).
*   **Trustless Execution:** If the AI hallucinates, is compromised, or attempts a terrible trade, the Soroban smart contract instantly rejects the transaction because it violates the cryptographic boundaries set by the user.

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
