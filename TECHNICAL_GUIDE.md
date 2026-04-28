# 🛠️ Sentinex Technical Documentation

## 🏗️ System Architecture
Sentinex is a three-tier decentralized application (dApp) designed for autonomous DeFi portfolio management on the Stellar network.

### 1. Frontend (Sentinex App)
- **Framework**: Next.js 14 (App Router)
- **State Management**: React Hooks & Context API
- **Styling**: Tailwind CSS with Framer Motion for high-fidelity animations.
- **Wallet Integration**: Freighter Extension (Stellar) and RainbowKit (EVM compatibility).
- **Communication**: WebSockets (Socket.io-client) for real-time AI thought streaming.

### 2. Backend (Sentinex Service)
- **Runtime**: Node.js / Express / TypeScript
- **AI Engine**: 
  - **Data Ingestion**: Scrapes financial news via CryptoPanic API.
  - **Sentiment Analysis**: Processes news snippets through OpenAI GPT-4 to determine market sentiment (Bullish/Bearish/Neutral).
- **Automation**: Executes Soroban smart contract calls based on sentiment thresholds.
- **Real-time Server**: Streams "AI Thought Process" to the frontend via WebSockets.

### 3. Smart Contracts (Sentinex Vault)
- **Language**: Rust (Soroban SDK)
- **Features**:
  - **Non-Custodial Storage**: Funds are held in a contract where only the owner has withdrawal rights.
  - **Restricted Execution**: The AI backend is granted a specific "Swap Role" that allows it to trigger trades but never withdraw funds.
  - **On-Chain Risk Guardrails**: Implements slippage checks and trade size limits directly in the contract logic.

## 🚀 Advanced Features (Black Belt)

### 1. The "Guardian" Sentiment Engine
The core innovation of Sentinex is the **Asynchronous Sentiment Execution**. Unlike traditional bots that react only to price, Sentinex reacts to *intent* and *news*. 
- **Proof of Implementation**: See `sentinex-service/src/engine/sentiment.ts` (Logic) and the `Activate Guardian` flow in the frontend.

### 2. Fee Sponsorship (Gasless Transactions)
Sentinex implements Stellar **Fee Bumps** to sponsor transaction fees for users.
- **Problem**: DeFi automation is often hindered by the need for users to maintain gas (XLM) in every sub-account or contract-controlled wallet.
- **Solution**: The Sentinex Service Backend wraps all autonomous trade transactions in a `FeeBumpTransaction`.
- **Impact**: Users can activate the Guardian and watch trades execute without ever worrying about network fees. The Sentinex Service "sponsors" the onboarding and trading costs to provide a seamless Web2-like experience.
- **Proof of Implementation**: See `sentinex-service/src/services/execution.service.ts` where transactions are wrapped and signed by the sponsor wallet.

## 📊 Data Indexing Approach
Sentinex utilizes a hybrid indexing strategy:
1. **Horizon API**: For real-time balance and transaction history.
2. **Custom Event Indexer**: The Node.js service listens for Soroban contract events to update the "Risk Matrix" state in the UI without polling.
3. **External Aggregators**: Uses Stellar Expert for deep historical verification.

## 🔒 Security Architecture
- **No Private Keys on Server**: The backend uses a delegated signing authority restricted by the Soroban contract.
- **CORS-Free Onboarding**: Uses a custom Next.js API route to proxy waitlist submissions to Google Forms, preventing client-side data leaks.
