echo "[DEPLOY] Building sentinex Vault contract..."
stellar contract build

echo "[DEPLOY] Optimizing WASM binary..."
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/sentinex_vault.wasm

echo "[DEPLOY] Generating owner keypair..."
stellar keys generate sentinex-owner --network testnet --fund 2>$null
if ($LASTEXITCODE -ne 0) { echo "[INFO] Key 'sentinex-owner' already exists or generation failed (ignoring error)" }

echo "[DEPLOY] Generating AI agent keypair..."
stellar keys generate sentinex-agent --network testnet --fund 2>$null
if ($LASTEXITCODE -ne 0) { echo "[INFO] Key 'sentinex-agent' already exists or generation failed (ignoring error)" }

$OWNER_ADDR = stellar keys address sentinex-owner
$AGENT_ADDR = stellar keys address sentinex-agent

echo "[DEPLOY] Owner:  $OWNER_ADDR"
echo "[DEPLOY] Agent:  $AGENT_ADDR"

echo "[DEPLOY] Deploying contract to Stellar Testnet..."
$CONTRACT_ID = stellar contract deploy --wasm target/wasm32-unknown-unknown/release/sentinex_vault.optimized.wasm --source sentinex-owner --network testnet

echo "[DEPLOY] Contract ID: $CONTRACT_ID"

echo "[DEPLOY] Initializing vault..."
stellar contract invoke --id $CONTRACT_ID --source sentinex-owner --network testnet -- initialize --owner $OWNER_ADDR --agent $AGENT_ADDR

echo "[DEPLOY] Setting default risk parameters (Balanced profile)..."
stellar contract invoke --id $CONTRACT_ID --source sentinex-owner --network testnet -- set_risk_params --max_slippage_bps 100 --max_trade_size 5000000000000 --max_daily_trades 10 --confidence_threshold 65

$AGENT_SECRET = stellar keys show sentinex-agent

echo ""
echo "============================================"
echo "  sentinex VAULT DEPLOYED SUCCESSFULLY"
echo "============================================"
echo "  Contract ID:  $CONTRACT_ID"
echo "  Owner:        $OWNER_ADDR"
echo "  Agent:        $AGENT_ADDR"
echo "  Network:      Testnet"
echo "============================================"
echo ""
echo "Save these values in your .env file:"
echo "SOROBAN_CONTRACT_ID=$CONTRACT_ID"
echo "STELLAR_OWNER_ADDRESS=$OWNER_ADDR"
echo "STELLAR_AGENT_ADDRESS=$AGENT_ADDR"
echo "STELLAR_AGENT_SECRET=$AGENT_SECRET"
