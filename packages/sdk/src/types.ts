import type { Address, Hash } from "viem";

// ─── Worker & Payroll Types ───────────────────────────────────────────────

export enum WorkerStatus {
  Inactive = 0,
  Active = 1,
  Suspended = 2,
}

export interface WorkerRecord {
  workerAddress: Address;
  employeeIdHash: Hash;
  status: WorkerStatus;
  registeredAt: bigint;
  lastClaimedAt: bigint;
  claimCount: bigint;
}

export interface PayrollDeployment {
  payrollAddress: Address;
  vaultAddress: Address;
  companyAdmin: Address;
  token: Address;
  chainId: number;
  deployedAt: number;
}

export interface SalaryInfo {
  workerAddress: Address;
  sealedSalary: `0x${string}`; // Re-encrypted ciphertext from FHE.sealOutput
  decryptedAmount?: bigint; // Populated after client-side unseal
  token: Address;
  decimals: number;
}

// ─── SDK Config ──────────────────────────────────────────────────────────

export interface PayShieldConfig {
  factoryAddress: Address;
  accessManagerAddress: Address;
  mockUSDCAddress: Address;
  rpcUrl: string;
  chainId: number;
}

// ─── CoFHE / FHE Types ───────────────────────────────────────────────────

export interface EncryptedInput {
  /** ABI-encoded InEuint128 — ready to pass as bytes calldata to contracts */
  encoded: `0x${string}`;
  /** The plaintext amount (kept in memory only, never sent to chain) */
  plaintextAmount: bigint;
}

export interface Permission {
  sealingKey: `0x${string}`;
}

// ─── Transaction Results ─────────────────────────────────────────────────

export interface CreatePayrollResult {
  txHash: Hash;
  payrollAddress: Address;
  vaultAddress: Address;
}

export interface AddWorkerResult {
  txHash: Hash;
  workerAddress: Address;
  employeeIdHash: Hash;
}

export interface ClaimSalaryResult {
  txHash: Hash;
  worker: Address;
  periodId: bigint;
  amount?: bigint; // populated if client can derive it
}

export interface FundPayrollResult {
  txHash: Hash;
  amount: bigint;
  vaultAddress: Address;
}
