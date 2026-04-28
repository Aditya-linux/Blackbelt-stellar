# 📘 Sentinex User Guide

Welcome to Sentinex, your autonomous DeFi guardian on Stellar. Follow this guide to set up and protect your portfolio.

## 🏁 Getting Started

### 1. Prerequisites
- Install the [Freighter Wallet](https://www.freighter.app/) extension.
- Switch your Freighter network to **Testnet**.
- Fund your wallet using the [Stellar Laboratory Faucet](https://laboratory.stellar.org/#account-creator?network=testnet).

### 2. Onboarding
1. Navigate to the Sentinex Landing Page.
2. Click **"Get Started"** or **"Connect Wallet"**.
3. You will be prompted to join the waitlist. Fill in your details and wallet address. This step ensures you are part of the early-access ecosystem.

### 3. Connecting Your Wallet
1. Click the **"Connect Wallet"** button in the navigation bar.
2. Approve the connection request in your Freighter extension.
3. Your live XLM balance and portfolio value will automatically populate on the dashboard.

## 🛡️ Using the Guardian

### 1. Selecting a Risk Profile
Sentinex offers three risk levels that determine how aggressively the AI trades:
- **Conservative**: Minimal trade sizes, high sentiment threshold required.
- **Balanced**: Moderate trade sizes, standard sentiment triggers.
- **Aggressive**: Larger trade sizes, reacts to early market signals.

### 2. Activating the AI
1. Scroll to the **Execution Terminal**.
2. Click **"Activate Guardian"**.
3. You will see a live feed of the AI "thinking". It will scan news, analyze sentiment, and display "Analyzing Sentiment..." messages.

### 3. Monitoring Trades
When the AI detects a significant event, it will:
1. Log the "Trade Intent" in the terminal.
2. Execute the Soroban smart contract call.
3. Display a **Transaction Hash**.
4. You can click the hash to view the transaction on **Stellar Expert**.

## 💰 Managing Funds
- **Deposit**: Use the "Vault" section to move XLM into the Sentinex Smart Contract.
- **Withdraw**: You can withdraw your funds at any time. The AI *cannot* block your withdrawals.
- **Emergency Stop**: Click "Deactivate" to immediately stop all AI trading activities.

## ❓ Troubleshooting
- **Balance not updating?** Refresh the page or ensure Freighter is on Testnet.
- **AI not trading?** The market might be quiet. The AI only trades when high-confidence sentiment signals are detected.
