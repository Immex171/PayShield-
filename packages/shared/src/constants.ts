// ─── Chain IDs ────────────────────────────────────────────────────────────
export const CHAIN_IDS = {
  HARDHAT: 31337,
  LOCAL_FHENIX: 412346,
  FHENIX_HELIUM_TESTNET: 8008135,
  ARBITRUM_SEPOLIA: 421614,
} as const;

// ─── Token ────────────────────────────────────────────────────────────────
export const USDC_DECIMALS = 6;
export const USDC_SYMBOL = "mUSDC";

// ─── Payroll ──────────────────────────────────────────────────────────────
export const MAX_WORKERS_PER_PAYROLL = 500;
export const MAX_UINT128 = BigInt("340282366920938463463374607431768211455");

// ─── UI ───────────────────────────────────────────────────────────────────
export const PRIVACY_SHIELD_TAGLINE = "Private payroll for public blockchains.";
export const SALARY_PLACEHOLDER = "●●●●●"; // shown when salary is not decrypted
