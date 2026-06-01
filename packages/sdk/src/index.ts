/**
 * @payshield/sdk
 *
 * Helper functions for interacting with PayShield smart contracts.
 * Abstracts CoFHE encryption, contract calls, and typed return values.
 *
 * Usage:
 *   import { encryptSalaryAmount, addWorkerWithEncryptedSalary } from '@payshield/sdk'
 */

export { encryptSalaryAmount, formatSalaryDisplay } from "./encryptWorkerSalary";
export * from "./types";
export {
  PAYSHIELD_FACTORY_ABI,
  PAYSHIELD_PAYROLL_ABI,
  PAYSHIELD_VAULT_ABI,
  MOCK_USDC_ABI,
  PAYSHIELD_ACCESS_MANAGER_ABI,
} from "./abis";

import type {
  CreatePayrollResult,
  AddWorkerResult,
  ClaimSalaryResult,
  FundPayrollResult,
  EncryptedInput,
} from "./types";
import {
  PAYSHIELD_FACTORY_ABI,
  PAYSHIELD_PAYROLL_ABI,
  PAYSHIELD_VAULT_ABI,
  MOCK_USDC_ABI,
} from "./abis";

/**
 * createCompanyPayroll
 * Calls PayShieldFactory.createPayroll() to deploy a new payroll + vault.
 *
 * @param factoryAddress PayShieldFactory contract address
 * @param tokenAddress ERC-20 token (MockUSDC or real USDC)
 * @param walletClient viem WalletClient (connected wallet)
 * @param publicClient viem PublicClient
 */
export async function createCompanyPayroll(params: {
  factoryAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
  walletClient: { writeContract: Function };
  publicClient: { waitForTransactionReceipt: Function; readContract: Function };
}): Promise<CreatePayrollResult> {
  const { factoryAddress, tokenAddress, walletClient, publicClient } = params;

  const hash = await walletClient.writeContract({
    address: factoryAddress,
    abi: PAYSHIELD_FACTORY_ABI,
    functionName: "createPayroll",
    args: [tokenAddress],
  });

  await publicClient.waitForTransactionReceipt({ hash });

  // Read back the deployed addresses
  const payrollAddress = await publicClient.readContract({
    address: factoryAddress,
    abi: PAYSHIELD_FACTORY_ABI,
    functionName: "getPayroll",
    args: [/* will be filled with account address */],
  });

  return {
    txHash: hash,
    payrollAddress: payrollAddress as `0x${string}`,
    vaultAddress: "0x" as `0x${string}`, // Resolved by caller
  };
}

/**
 * addWorkerWithEncryptedSalary
 * Encrypts salary client-side then calls PayShieldPayroll.addWorker()
 *
 * @param payrollAddress PayShieldPayroll contract address
 * @param worker Worker wallet address
 * @param employeeId Off-chain employee identifier (will be hashed)
 * @param salaryAmount Salary in token base units
 * @param walletClient viem WalletClient
 * @param cofheClient Optional CoFHE client (uses mock if omitted)
 */
export async function addWorkerWithEncryptedSalary(params: {
  payrollAddress: `0x${string}`;
  worker: `0x${string}`;
  employeeId: string;
  salaryAmount: bigint;
  walletClient: { writeContract: Function };
  publicClient: { waitForTransactionReceipt: Function };
  cofheClient?: unknown;
}): Promise<AddWorkerResult> {
  const { encryptSalaryAmount } = await import("./encryptWorkerSalary");
  const { keccak256, toHex, toBytes } = await import("viem");

  const encrypted: EncryptedInput = await encryptSalaryAmount(
    params.salaryAmount,
    params.cofheClient
  );

  const employeeIdHash = keccak256(toHex(toBytes(params.employeeId)));

  const hash = await params.walletClient.writeContract({
    address: params.payrollAddress,
    abi: PAYSHIELD_PAYROLL_ABI,
    functionName: "addWorker",
    args: [params.worker, employeeIdHash, encrypted.encoded],
  });

  await params.publicClient.waitForTransactionReceipt({ hash });

  return {
    txHash: hash,
    workerAddress: params.worker,
    employeeIdHash,
  };
}

/**
 * fundPayroll
 * Approves token spend and deposits into the PayShieldVault
 */
export async function fundPayroll(params: {
  vaultAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
  amount: bigint;
  walletClient: { writeContract: Function; account: { address: `0x${string}` } };
  publicClient: { waitForTransactionReceipt: Function };
}): Promise<FundPayrollResult> {
  const { vaultAddress, tokenAddress, amount, walletClient, publicClient } = params;

  // Approve
  const approveHash = await walletClient.writeContract({
    address: tokenAddress,
    abi: MOCK_USDC_ABI,
    functionName: "approve",
    args: [vaultAddress, amount],
  });
  await publicClient.waitForTransactionReceipt({ hash: approveHash });

  // Deposit
  const depositHash = await walletClient.writeContract({
    address: vaultAddress,
    abi: PAYSHIELD_VAULT_ABI,
    functionName: "deposit",
    args: [amount],
  });
  await publicClient.waitForTransactionReceipt({ hash: depositHash });

  return {
    txHash: depositHash,
    amount,
    vaultAddress,
  };
}

/**
 * claimSalary
 * Worker calls PayShieldPayroll.claimSalary() to receive payment
 */
export async function claimSalary(params: {
  payrollAddress: `0x${string}`;
  walletClient: { writeContract: Function };
  publicClient: { waitForTransactionReceipt: Function };
}): Promise<ClaimSalaryResult> {
  const { payrollAddress, walletClient, publicClient } = params;

  const hash = await walletClient.writeContract({
    address: payrollAddress,
    abi: PAYSHIELD_PAYROLL_ABI,
    functionName: "claimSalary",
    args: [],
  });

  await publicClient.waitForTransactionReceipt({ hash });

  return {
    txHash: hash,
    worker: "0x" as `0x${string}`,
    periodId: 0n,
  };
}

/**
 * grantAuditorAccess
 * Company admin grants an auditor access to view salary proofs
 */
export async function grantAuditorAccess(params: {
  payrollAddress: `0x${string}`;
  auditorAddress: `0x${string}`;
  walletClient: { writeContract: Function };
  publicClient: { waitForTransactionReceipt: Function };
}): Promise<{ txHash: `0x${string}` }> {
  const hash = await params.walletClient.writeContract({
    address: params.payrollAddress,
    abi: PAYSHIELD_PAYROLL_ABI,
    functionName: "grantAuditorAccess",
    args: [params.auditorAddress],
  });

  await params.publicClient.waitForTransactionReceipt({ hash });
  return { txHash: hash };
}

/**
 * decryptWorkerSalary
 * Fetches the sealed (re-encrypted) salary ciphertext and unseals it client-side.
 * Only the authorized worker/auditor/admin can call this successfully.
 *
 * @returns Plaintext salary amount (bigint) — only lives in browser memory
 */
export async function decryptWorkerSalary(params: {
  payrollAddress: `0x${string}`;
  workerAddress: `0x${string}`;
  publicClient: { readContract: Function };
  cofheClient?: { unseal: (ciphertext: `0x${string}`, permission: unknown) => Promise<bigint> };
  permission: { sealingKey: `0x${string}` };
}): Promise<bigint> {
  const sealedBytes = await params.publicClient.readContract({
    address: params.payrollAddress,
    abi: PAYSHIELD_PAYROLL_ABI,
    functionName: "getSealedSalary",
    args: [params.workerAddress, params.permission],
  });

  if (params.cofheClient) {
    // Real Fhenix: unseal the ciphertext client-side with user's private key
    return await params.cofheClient.unseal(sealedBytes as `0x${string}`, params.permission);
  } else {
    // Mock mode: the sealed bytes directly encode the plaintext
    const { decodeAbiParameters } = await import("viem");
    try {
      const [decoded] = decodeAbiParameters([{ type: "uint128" }], sealedBytes as `0x${string}`);
      return BigInt(decoded);
    } catch {
      return 0n;
    }
  }
}

/**
 * updateEncryptedSalary
 * Admin updates a worker's salary with a new encrypted value
 */
export async function updateEncryptedSalary(params: {
  payrollAddress: `0x${string}`;
  workerAddress: `0x${string}`;
  newSalaryAmount: bigint;
  walletClient: { writeContract: Function };
  publicClient: { waitForTransactionReceipt: Function };
  cofheClient?: unknown;
}): Promise<{ txHash: `0x${string}` }> {
  const { encryptSalaryAmount } = await import("./encryptWorkerSalary");

  const encrypted = await encryptSalaryAmount(
    params.newSalaryAmount,
    params.cofheClient
  );

  const hash = await params.walletClient.writeContract({
    address: params.payrollAddress,
    abi: PAYSHIELD_PAYROLL_ABI,
    functionName: "updateWorkerSalary",
    args: [params.workerAddress, encrypted.encoded],
  });

  await params.publicClient.waitForTransactionReceipt({ hash });
  return { txHash: hash };
}
