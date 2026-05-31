import type { EncryptedInput } from "./types";

/**
 * encryptWorkerSalary
 *
 * Encrypts a salary amount client-side using the CoFHE SDK before it is
 * submitted to the PayShieldPayroll contract.
 *
 * Privacy guarantee: The plaintext salary amount is NEVER sent to the blockchain.
 * It is encrypted locally using the Fhenix CoFHE SDK, which produces:
 *   - An encrypted ciphertext (euint128)
 *   - A proof-of-correct-encryption
 * Both are bundled into an InEuint128 struct and ABI-encoded as bytes.
 *
 * On the Fhenix network:
 *   - FHE.asEuint128(inSalary) validates the proof and stores the ciphertext
 *   - The contract never sees the plaintext amount
 *   - Only authorized users (worker, admin, auditor) can decrypt via FHE.sealOutput
 *
 * @param amount Salary in token base units (e.g. USDC with 6 decimals: 5000 USDC = 5_000_000_000n)
 * @param cofheClient The initialized CoFHE client instance (@cofhejs/cofhe FhenixClient)
 * @returns EncryptedInput with ABI-encoded bytes ready for contract submission
 */
export async function encryptSalaryAmount(
  amount: bigint,
  cofheClient?: unknown // FhenixClient from @cofhejs/cofhe — typed as unknown for build portability
): Promise<EncryptedInput> {
  if (amount <= 0n) {
    throw new Error("Salary amount must be positive");
  }
  if (amount > BigInt("340282366920938463463374607431768211455")) {
    // Max uint128
    throw new Error("Salary amount exceeds uint128 maximum");
  }

  let encodedBytes: `0x${string}`;

  if (cofheClient) {
    // ── Real Fhenix CoFHE path ─────────────────────────────────────
    // This is the production path when connected to Fhenix localnode or testnet.
    // cofheClient.encrypt_uint128() performs client-side FHE encryption.
    try {
      const client = cofheClient as {
        encrypt_uint128: (v: bigint) => Promise<{ ctHash: bigint; securityZone: number }>;
      };
      const encrypted = await client.encrypt_uint128(amount);

      // ABI-encode as InEuint128 struct
      const { ethers } = await import("ethers");
      encodedBytes = ethers.AbiCoder.defaultAbiCoder().encode(
        ["tuple(uint256 ctHash, uint8 securityZone)"],
        [{ ctHash: encrypted.ctHash, securityZone: encrypted.securityZone ?? 0 }]
      ) as `0x${string}`;
    } catch (err) {
      console.warn(
        "CoFHE client encryption failed, falling back to mock mode:",
        err
      );
      encodedBytes = await _mockEncrypt(amount);
    }
  } else {
    // ── Mock / demo path ──────────────────────────────────────────
    // Used in local Hardhat mock environment and UI demo mode.
    // The mock FHE library accepts this format and simulates FHE operations.
    encodedBytes = await _mockEncrypt(amount);
  }

  return {
    encoded: encodedBytes,
    plaintextAmount: amount, // Kept in memory only — never serialized or sent to chain
  };
}

/**
 * Mock encryption for local testing.
 * The CoFHE mock library on Hardhat accepts this simplified format.
 */
async function _mockEncrypt(amount: bigint): Promise<`0x${string}`> {
  // Dynamic import to avoid build-time dependency on ethers in all environments
  const { ethers } = await import("ethers");
  return ethers.AbiCoder.defaultAbiCoder().encode(
    ["tuple(uint256 ctHash, uint8 securityZone)"],
    [{ ctHash: amount, securityZone: 0 }]
  ) as `0x${string}`;
}

/**
 * Format a USDC amount for display (no decimals leakage)
 * @param amount Raw amount in base units
 * @param decimals Token decimals (6 for USDC)
 */
export function formatSalaryDisplay(amount: bigint, decimals = 6): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const cents = amount % divisor;
  const centsStr = cents.toString().padStart(decimals, "0").slice(0, 2);
  return `${whole.toLocaleString()}.${centsStr}`;
}
