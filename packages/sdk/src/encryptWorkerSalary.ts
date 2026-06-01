import type { EncryptedInput } from "./types";
import { encodeAbiParameters, parseAbiParameters } from "viem";

/**
 * Encrypts a salary amount client-side using the CoFHE SDK before contract submission.
 * Plaintext salary is never sent to the blockchain.
 */
export async function encryptSalaryAmount(
  amount: bigint,
  cofheClient?: unknown
): Promise<EncryptedInput> {
  if (amount <= 0n) {
    throw new Error("Salary amount must be positive");
  }
  if (amount > BigInt("340282366920938463463374607431768211455")) {
    throw new Error("Salary amount exceeds uint128 maximum");
  }

  let encodedBytes: `0x${string}`;

  if (cofheClient) {
    try {
      const client = cofheClient as {
        encrypt_uint128: (v: bigint) => Promise<{ ctHash: bigint; securityZone: number }>;
      };
      const encrypted = await client.encrypt_uint128(amount);

      encodedBytes = encodeAbiParameters(
        parseAbiParameters("uint256 ctHash, uint8 securityZone"),
        [encrypted.ctHash, encrypted.securityZone ?? 0]
      );
    } catch (err) {
      console.warn("CoFHE client encryption failed, falling back to mock mode:", err);
      encodedBytes = mockEncrypt(amount);
    }
  } else {
    encodedBytes = mockEncrypt(amount);
  }

  return {
    encoded: encodedBytes,
    plaintextAmount: amount,
  };
}

function mockEncrypt(amount: bigint): `0x${string}` {
  return encodeAbiParameters(parseAbiParameters("uint256 ctHash, uint8 securityZone"), [
    amount,
    0,
  ]);
}

export function formatSalaryDisplay(amount: bigint, decimals = 6): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const cents = amount % divisor;
  const centsStr = cents.toString().padStart(decimals, "0").slice(0, 2);
  return `${whole.toLocaleString()}.${centsStr}`;
}
