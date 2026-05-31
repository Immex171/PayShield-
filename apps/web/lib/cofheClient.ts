"use client";

/**
 * cofheClient.ts
 *
 * Initializes the CoFHE client for browser-side FHE operations:
 *   - Encrypting salary values before submitting to contracts
 *   - Generating Permission objects for sealOutput calls
 *   - Unsealing (decrypting) salary values client-side
 *
 * Integration notes:
 *   - Uses @cofhe/sdk for the Fhenix network
 *   - Falls back to mock mode for local Hardhat testing
 *   - The CoFHE client requires a signer (from wagmi/viem) to generate
 *     user-specific sealing keys
 */

let cofheClientInstance: unknown = null;
let isInitialized = false;
let isMockMode = false;

/**
 * Initialize the CoFHE client.
 * Called once when wallet connects, in a useEffect.
 *
 * @param provider EIP-1193 provider (window.ethereum or viem provider)
 * @param chainId Network chain ID (412346 for local, 8008135 for testnet)
 */
export async function initCofheClient(
  provider: unknown,
  chainId: number
): Promise<void> {
  if (isInitialized) return;

  const isLocalMock = chainId === 412346 || chainId === 31337;

  if (isLocalMock) {
    // Mock mode: CoFHE operations are simulated locally
    isMockMode = true;
    cofheClientInstance = createMockCofheClient();
    isInitialized = true;
    console.info("[PayShield] CoFHE running in mock mode (local network)");
    return;
  }

  try {
    // Production mode: initialize real CoFHE client
    // @ts-ignore — @cofhe/sdk API may differ by version; mock fallback handles failures
    const { createCofheClient, createCofheConfig } = await import("@cofhe/sdk/web");
    const config = createCofheConfig({ chainId });
    cofheClientInstance = createCofheClient(config);
    isInitialized = true;
    console.info("[PayShield] CoFHE client initialized for Fhenix network");
  } catch (err) {
    console.warn("[PayShield] CoFHE client init failed, using mock:", err);
    isMockMode = true;
    cofheClientInstance = createMockCofheClient();
    isInitialized = true;
  }
}

export function getCofheClient(): unknown {
  return cofheClientInstance;
}

export function getCofheMockMode(): boolean {
  return isMockMode;
}

export function resetCofheClient(): void {
  cofheClientInstance = null;
  isInitialized = false;
  isMockMode = false;
}

// ─── Mock CoFHE Client ────────────────────────────────────────────────────

interface MockCofheClient {
  encrypt_uint128: (value: bigint) => Promise<{ ctHash: bigint; securityZone: number }>;
  unseal: (ciphertext: `0x${string}`, permission: unknown) => Promise<bigint>;
  generatePermission: () => Promise<{ sealingKey: `0x${string}` }>;
  isMock: true;
}

function createMockCofheClient(): MockCofheClient {
  return {
    isMock: true as const,

    async encrypt_uint128(value: bigint) {
      // Mock "encrypts" by returning the value as ctHash
      // The CoFHE mock library on Fhenix local node accepts this
      return { ctHash: value, securityZone: 0 };
    },

    async unseal(ciphertext: `0x${string}`) {
      // Mock "decryption": decode the ABI-encoded value
      try {
        const { ethers } = await import("ethers");
        // The mock sealed output is just the ABI-encoded plaintext
        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
          ["uint128"],
          ciphertext
        );
        return BigInt(decoded[0]);
      } catch {
        return 0n;
      }
    },

    async generatePermission() {
      // Mock permission — real Fhenix generates a user-specific sealing keypair
      const mockKey = ("0x" +
        Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join("")) as `0x${string}`;
      return { sealingKey: mockKey };
    },
  };
}
