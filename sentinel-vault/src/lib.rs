#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror, symbol_short,
    Address, Env, log,
};

// ---------------------------------------------------------------------------
// Error Codes
// ---------------------------------------------------------------------------
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VaultError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    InsufficientBalance = 4,
    SlippageExceeded = 5,
    TradeSizeExceeded = 6,
    InvalidAmount = 7,
    InvalidRiskParams = 8,
    VaultPaused = 9,
}

// ---------------------------------------------------------------------------
// Storage Keys
// ---------------------------------------------------------------------------
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Owner,
    Agent,
    Balance(Address),
    RiskParams,
    Paused,
    TradeNonce,
    TotalDeposited(Address),
    TotalWithdrawn(Address),
}

// ---------------------------------------------------------------------------
// Risk Parameters -- user-signed boundaries the AI cannot exceed
// ---------------------------------------------------------------------------
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RiskParameters {
    pub max_slippage_bps: u32,
    pub max_trade_size: u128,
    pub max_daily_trades: u32,
    pub daily_trade_count: u32,
    pub window_start: u64,
    pub confidence_threshold: u32,
}

// ---------------------------------------------------------------------------
// Swap Record -- emitted as event for off-chain indexing
// ---------------------------------------------------------------------------
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SwapRecord {
    pub token_in: Address,
    pub token_out: Address,
    pub amount_in: u128,
    pub min_amount_out: u128,
    pub nonce: u64,
    pub ledger: u32,
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------
#[contract]
pub struct NonCustodialVault;

#[contractimpl]
impl NonCustodialVault {

    /// Initialize the vault. Called once by the owner.
    pub fn initialize(
        env: Env,
        owner: Address,
        agent: Address,
    ) -> Result<(), VaultError> {
        if env.storage().instance().has(&DataKey::Owner) {
            return Err(VaultError::AlreadyInitialized);
        }
        owner.require_auth();

        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::Agent, &agent);
        env.storage().instance().set(&DataKey::Paused, &false);
        env.storage().instance().set(&DataKey::TradeNonce, &0u64);

        let default_risk = RiskParameters {
            max_slippage_bps: 50,
            max_trade_size: 1_000_0000000,
            max_daily_trades: 5,
            daily_trade_count: 0,
            window_start: env.ledger().sequence() as u64,
            confidence_threshold: 70,
        };
        env.storage().instance().set(&DataKey::RiskParams, &default_risk);

        env.events().publish((symbol_short!("init"),), (owner, agent));
        log!(&env, "Vault initialized");
        Ok(())
    }

    /// Deposit tokens into the vault. Only the owner can deposit.
    pub fn deposit(env: Env, token: Address, amount: u128) -> Result<(), VaultError> {
        let owner: Address = env.storage().instance()
            .get(&DataKey::Owner).ok_or(VaultError::NotInitialized)?;
        owner.require_auth();

        if amount == 0 { return Err(VaultError::InvalidAmount); }

        let contract_addr = env.current_contract_address();
        Self::xfer(&env, &token, &owner, &contract_addr, amount);

        let key = DataKey::Balance(token.clone());
        let cur: u128 = env.storage().instance().get(&key).unwrap_or(0);
        env.storage().instance().set(&key, &(cur + amount));

        let dk = DataKey::TotalDeposited(token.clone());
        let td: u128 = env.storage().instance().get(&dk).unwrap_or(0);
        env.storage().instance().set(&dk, &(td + amount));

        env.events().publish((symbol_short!("deposit"),), (token, amount));
        Ok(())
    }

    /// Withdraw tokens. ONLY the owner can withdraw -- the AI agent CANNOT.
    pub fn withdraw(env: Env, token: Address, amount: u128) -> Result<(), VaultError> {
        let owner: Address = env.storage().instance()
            .get(&DataKey::Owner).ok_or(VaultError::NotInitialized)?;
        owner.require_auth();

        if amount == 0 { return Err(VaultError::InvalidAmount); }

        let key = DataKey::Balance(token.clone());
        let cur: u128 = env.storage().instance().get(&key).unwrap_or(0);
        if cur < amount { return Err(VaultError::InsufficientBalance); }

        let contract_addr = env.current_contract_address();
        Self::xfer(&env, &token, &contract_addr, &owner, amount);
        env.storage().instance().set(&key, &(cur - amount));

        let wk = DataKey::TotalWithdrawn(token.clone());
        let tw: u128 = env.storage().instance().get(&wk).unwrap_or(0);
        env.storage().instance().set(&wk, &(tw + amount));

        env.events().publish((symbol_short!("withdraw"),), (token, amount));
        Ok(())
    }

    /// Update risk parameters. Only the owner can change these.
    pub fn set_risk_params(
        env: Env,
        max_slippage_bps: u32,
        max_trade_size: u128,
        max_daily_trades: u32,
        confidence_threshold: u32,
    ) -> Result<(), VaultError> {
        let owner: Address = env.storage().instance()
            .get(&DataKey::Owner).ok_or(VaultError::NotInitialized)?;
        owner.require_auth();

        if max_slippage_bps == 0 || max_slippage_bps > 1000 {
            return Err(VaultError::InvalidRiskParams);
        }
        if max_trade_size == 0 { return Err(VaultError::InvalidRiskParams); }
        if confidence_threshold == 0 || confidence_threshold > 100 {
            return Err(VaultError::InvalidRiskParams);
        }

        let params = RiskParameters {
            max_slippage_bps,
            max_trade_size,
            max_daily_trades,
            daily_trade_count: 0,
            window_start: env.ledger().sequence() as u64,
            confidence_threshold,
        };
        env.storage().instance().set(&DataKey::RiskParams, &params);
        env.events().publish((symbol_short!("risk"),), (max_slippage_bps, max_trade_size));
        Ok(())
    }

    // -----------------------------------------------------------------------
    // EXECUTE SWAP -- 7-gate security model
    //
    // Gate 0: Vault must not be paused
    // Gate 1: Caller must be registered AI agent
    // Gate 2: AI confidence must meet user threshold
    // Gate 3: Trade size must not exceed user max
    // Gate 4: Slippage must not exceed user max
    // Gate 5: Daily trade count must not exceed user max
    // Gate 6: Vault must have sufficient balance
    //
    // The agent can ONLY swap assets within the vault.
    // The agent CANNOT withdraw funds to any external address.
    // -----------------------------------------------------------------------
    pub fn execute_swap(
        env: Env,
        token_in: Address,
        token_out: Address,
        amount_in: u128,
        min_amount_out: u128,
        confidence: u32,
    ) -> Result<SwapRecord, VaultError> {
        // Gate 0
        let paused: bool = env.storage().instance()
            .get(&DataKey::Paused).unwrap_or(true);
        if paused { return Err(VaultError::VaultPaused); }

        // Gate 1
        let agent: Address = env.storage().instance()
            .get(&DataKey::Agent).ok_or(VaultError::NotInitialized)?;
        agent.require_auth();

        // Load risk params
        let mut risk: RiskParameters = env.storage().instance()
            .get(&DataKey::RiskParams).ok_or(VaultError::NotInitialized)?;

        // Gate 2: confidence
        if confidence < risk.confidence_threshold {
            return Err(VaultError::Unauthorized);
        }

        // Gate 3: trade size
        if amount_in > risk.max_trade_size {
            return Err(VaultError::TradeSizeExceeded);
        }

        // Gate 4: slippage
        let floor = amount_in
            .checked_mul(10000 - risk.max_slippage_bps as u128)
            .unwrap_or(0) / 10000;
        if min_amount_out < floor {
            return Err(VaultError::SlippageExceeded);
        }

        // Gate 5: daily trade count
        let seq = env.ledger().sequence() as u64;
        let window: u64 = 17280; // ~24h at 5s/ledger
        if seq - risk.window_start > window {
            risk.daily_trade_count = 0;
            risk.window_start = seq;
        }
        if risk.daily_trade_count >= risk.max_daily_trades {
            return Err(VaultError::TradeSizeExceeded);
        }

        // Gate 6: balance
        let bk = DataKey::Balance(token_in.clone());
        let bal: u128 = env.storage().instance().get(&bk).unwrap_or(0);
        if bal < amount_in { return Err(VaultError::InsufficientBalance); }

        // --- All gates passed ---
        let nonce: u64 = env.storage().instance()
            .get(&DataKey::TradeNonce).unwrap_or(0);
        env.storage().instance().set(&DataKey::TradeNonce, &(nonce + 1));

        // Debit token_in, credit token_out
        env.storage().instance().set(&bk, &(bal - amount_in));
        let ok = DataKey::Balance(token_out.clone());
        let ob: u128 = env.storage().instance().get(&ok).unwrap_or(0);
        env.storage().instance().set(&ok, &(ob + min_amount_out));

        risk.daily_trade_count += 1;
        env.storage().instance().set(&DataKey::RiskParams, &risk);

        let record = SwapRecord {
            token_in: token_in.clone(),
            token_out: token_out.clone(),
            amount_in,
            min_amount_out,
            nonce,
            ledger: env.ledger().sequence(),
        };
        env.events().publish((symbol_short!("swap"),), record.clone());
        log!(&env, "Swap executed: nonce={}", nonce);
        Ok(record)
    }

    /// Pause all trading. Only the owner can call.
    pub fn pause(env: Env) -> Result<(), VaultError> {
        let owner: Address = env.storage().instance()
            .get(&DataKey::Owner).ok_or(VaultError::NotInitialized)?;
        owner.require_auth();
        env.storage().instance().set(&DataKey::Paused, &true);
        env.events().publish((symbol_short!("pause"),), true);
        Ok(())
    }

    /// Unpause trading. Only the owner can call.
    pub fn unpause(env: Env) -> Result<(), VaultError> {
        let owner: Address = env.storage().instance()
            .get(&DataKey::Owner).ok_or(VaultError::NotInitialized)?;
        owner.require_auth();
        env.storage().instance().set(&DataKey::Paused, &false);
        env.events().publish((symbol_short!("unpause"),), false);
        Ok(())
    }

    /// Rotate the AI agent address. Only the owner can call.
    pub fn rotate_agent(env: Env, new_agent: Address) -> Result<(), VaultError> {
        let owner: Address = env.storage().instance()
            .get(&DataKey::Owner).ok_or(VaultError::NotInitialized)?;
        owner.require_auth();
        env.storage().instance().set(&DataKey::Agent, &new_agent);
        env.events().publish((symbol_short!("rotate"),), new_agent);
        Ok(())
    }

    // -- View functions --
    pub fn get_balance(env: Env, token: Address) -> u128 {
        env.storage().instance().get(&DataKey::Balance(token)).unwrap_or(0)
    }

    pub fn get_risk_params(env: Env) -> Result<RiskParameters, VaultError> {
        env.storage().instance().get(&DataKey::RiskParams).ok_or(VaultError::NotInitialized)
    }

    pub fn get_owner(env: Env) -> Result<Address, VaultError> {
        env.storage().instance().get(&DataKey::Owner).ok_or(VaultError::NotInitialized)
    }

    pub fn get_agent(env: Env) -> Result<Address, VaultError> {
        env.storage().instance().get(&DataKey::Agent).ok_or(VaultError::NotInitialized)
    }

    pub fn is_paused(env: Env) -> bool {
        env.storage().instance().get(&DataKey::Paused).unwrap_or(true)
    }

    pub fn get_nonce(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::TradeNonce).unwrap_or(0)
    }

    // -- Internal --
    fn xfer(env: &Env, token: &Address, from: &Address, to: &Address, amount: u128) {
        let client = soroban_sdk::token::Client::new(env, token);
        client.transfer(from, to, &(amount as i128));
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, token::StellarAssetClient, Env};

    fn setup() -> (Env, Address, Address, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();
        let cid = env.register_contract(None, NonCustodialVault);
        let owner = Address::generate(&env);
        let agent = Address::generate(&env);
        let admin = Address::generate(&env);
        let tc = env.register_stellar_asset_contract_v2(admin.clone());
        let ta = tc.address();
        StellarAssetClient::new(&env, &ta).mint(&owner, &10_000_0000000i128);
        (env, cid, owner, agent, ta)
    }

    #[test]
    fn test_initialize() {
        let (env, cid, owner, agent, _) = setup();
        let c = NonCustodialVaultClient::new(&env, &cid);
        c.initialize(&owner, &agent);
        assert_eq!(c.get_owner(), owner);
        assert_eq!(c.get_agent(), agent);
        assert!(!c.is_paused());
    }

    #[test]
    #[should_panic(expected = "AlreadyInitialized")]
    fn test_double_init() {
        let (env, cid, owner, agent, _) = setup();
        let c = NonCustodialVaultClient::new(&env, &cid);
        c.initialize(&owner, &agent);
        c.initialize(&owner, &agent);
    }

    #[test]
    fn test_deposit_withdraw() {
        let (env, cid, owner, agent, tok) = setup();
        let c = NonCustodialVaultClient::new(&env, &cid);
        c.initialize(&owner, &agent);
        c.deposit(&tok, &1000_0000000u128);
        assert_eq!(c.get_balance(&tok), 1000_0000000u128);
        c.withdraw(&tok, &400_0000000u128);
        assert_eq!(c.get_balance(&tok), 600_0000000u128);
    }

    #[test]
    #[should_panic(expected = "InsufficientBalance")]
    fn test_overdraw() {
        let (env, cid, owner, agent, tok) = setup();
        let c = NonCustodialVaultClient::new(&env, &cid);
        c.initialize(&owner, &agent);
        c.deposit(&tok, &100_0000000u128);
        c.withdraw(&tok, &200_0000000u128);
    }

    #[test]
    fn test_swap_within_bounds() {
        let (env, cid, owner, agent, ti) = setup();
        let c = NonCustodialVaultClient::new(&env, &cid);
        let a2 = Address::generate(&env);
        let tc2 = env.register_stellar_asset_contract_v2(a2);
        let to = tc2.address();

        c.initialize(&owner, &agent);
        c.deposit(&ti, &2000_0000000u128);
        c.set_risk_params(&100u32, &500_0000000u128, &10u32, &60u32);

        let r = c.execute_swap(&ti, &to, &200_0000000u128, &199_0000000u128, &85u32);
        assert_eq!(r.amount_in, 200_0000000u128);
        assert_eq!(r.nonce, 0);
        assert_eq!(c.get_balance(&ti), 1800_0000000u128);
        assert_eq!(c.get_balance(&to), 199_0000000u128);
        assert_eq!(c.get_nonce(), 1);
    }

    #[test]
    #[should_panic(expected = "TradeSizeExceeded")]
    fn test_swap_over_max() {
        let (env, cid, owner, agent, ti) = setup();
        let c = NonCustodialVaultClient::new(&env, &cid);
        let a2 = Address::generate(&env);
        let tc2 = env.register_stellar_asset_contract_v2(a2);
        let to = tc2.address();
        c.initialize(&owner, &agent);
        c.deposit(&ti, &5000_0000000u128);
        c.set_risk_params(&100u32, &500_0000000u128, &10u32, &60u32);
        c.execute_swap(&ti, &to, &1000_0000000u128, &990_0000000u128, &85u32);
    }

    #[test]
    #[should_panic(expected = "SlippageExceeded")]
    fn test_swap_slippage() {
        let (env, cid, owner, agent, ti) = setup();
        let c = NonCustodialVaultClient::new(&env, &cid);
        let a2 = Address::generate(&env);
        let tc2 = env.register_stellar_asset_contract_v2(a2);
        let to = tc2.address();
        c.initialize(&owner, &agent);
        c.deposit(&ti, &5000_0000000u128);
        c.set_risk_params(&50u32, &500_0000000u128, &10u32, &60u32);
        c.execute_swap(&ti, &to, &200_0000000u128, &190_0000000u128, &85u32);
    }

    #[test]
    fn test_pause_blocks_swap() {
        let (env, cid, owner, agent, ti) = setup();
        let c = NonCustodialVaultClient::new(&env, &cid);
        let a2 = Address::generate(&env);
        let tc2 = env.register_stellar_asset_contract_v2(a2);
        let to = tc2.address();
        c.initialize(&owner, &agent);
        c.deposit(&ti, &2000_0000000u128);
        c.set_risk_params(&100u32, &500_0000000u128, &10u32, &60u32);

        c.pause();
        assert!(c.is_paused());
        let res = c.try_execute_swap(&ti, &to, &100_0000000u128, &99_0000000u128, &85u32);
        assert!(res.is_err());

        c.unpause();
        let r = c.execute_swap(&ti, &to, &100_0000000u128, &99_0000000u128, &85u32);
        assert_eq!(r.nonce, 0);
    }

    #[test]
    fn test_rotate_agent() {
        let (env, cid, owner, agent, _) = setup();
        let c = NonCustodialVaultClient::new(&env, &cid);
        c.initialize(&owner, &agent);
        let na = Address::generate(&env);
        c.rotate_agent(&na);
        assert_eq!(c.get_agent(), na);
    }
}
