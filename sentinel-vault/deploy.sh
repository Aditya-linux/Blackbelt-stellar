#!/bin/bash
# ============================================================================
# Sentinel Vault -- Stellar Testnet Deployment Script
# ============================================================================
# Prerequisites:
#   1. Install Stellar CLI: cargo install --locked stellar-cli --features opt
#   2. Install Rust wasm target: rustup target add wasm32-unknown-unknown
#   3. Fund testnet accounts at https://laboratory.stellar.org/#account-creator?network=test
# ============================================================================

set -e

echo "[DEPLOY] Building Sentinel Vault contract..."
stellar contract build

echo "[DEPLOY] Optimizing WASM binary..."
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/sentinel_vault.wasm

echo "[DEPLOY] Generating owner keypair..."
stellar keys generate sentinel-owner \
    --network testnet \
    --fund \
    2>/dev/null || echo "[INFO] Key 'sentinel-owner' already exists"

echo "[DEPLOY] Generating AI agent keypair..."
stellar keys generate sentinel-agent \
    --network testnet \
    --fund \
    2>/dev/null || echo "[INFO] Key 'sentinel-agent' already exists"

OWNER_ADDR=$(stellar keys address sentinel-owner)
AGENT_ADDR=$(stellar keys address sentinel-agent)

echo "[DEPLOY] Owner:  $OWNER_ADDR"
echo "[DEPLOY] Agent:  $AGENT_ADDR"

echo "[DEPLOY] Deploying contract to Stellar Testnet..."
CONTRACT_ID=$(stellar contract deploy \
    --wasm target/wasm32-unknown-unknown/release/sentinel_vault.optimized.wasm \
    --source sentinel-owner \
    --network testnet)

echo "[DEPLOY] Contract ID: $CONTRACT_ID"

echo "[DEPLOY] Initializing vault..."
stellar contract invoke \
    --id "$CONTRACT_ID" \
    --source sentinel-owner \
    --network testnet \
    -- \
    initialize \
    --owner "$OWNER_ADDR" \
    --agent "$AGENT_ADDR"

echo "[DEPLOY] Setting default risk parameters (Balanced profile)..."
stellar contract invoke \
    --id "$CONTRACT_ID" \
    --source sentinel-owner \
    --network testnet \
    -- \
    set_risk_params \
    --max_slippage_bps 100 \
    --max_trade_size 5000000000000 \
    --max_daily_trades 10 \
    --confidence_threshold 65

echo ""
echo "============================================"
echo "  SENTINEL VAULT DEPLOYED SUCCESSFULLY"
echo "============================================"
echo "  Contract ID:  $CONTRACT_ID"
echo "  Owner:        $OWNER_ADDR"
echo "  Agent:        $AGENT_ADDR"
echo "  Network:      Testnet"
echo "============================================"
echo ""
echo "Save these values in your .env file:"
echo "  SOROBAN_CONTRACT_ID=$CONTRACT_ID"
echo "  STELLAR_OWNER_ADDRESS=$OWNER_ADDR"
echo "  STELLAR_AGENT_ADDRESS=$AGENT_ADDR"
echo "  STELLAR_AGENT_SECRET=$(stellar keys show sentinel-agent)"
