import {
  type Address,
  type Hex,
  encodePacked,
  keccak256,
  toHex,
} from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

export interface StealthKeyPair {
  /** Ephemeral private key — store securely in browser localStorage */
  spendingPrivateKey: Hex;
  /** Derived one-time payout address for this claim period */
  payoutAddress: Address;
  /** Public meta-address hash for employer reference */
  metaAddressHash: Hex;
}

/**
 * Generates a fresh stealth payout address for salary claims.
 * Based on ERC-5564 patterns: a one-time address unlinked from the worker's main wallet.
 *
 * The worker holds the spending key locally to sweep funds after claim.
 */
export function generateStealthPayoutAddress(): StealthKeyPair {
  const spendingPrivateKey = generatePrivateKey();
  const account = privateKeyToAccount(spendingPrivateKey);
  const metaAddressHash = keccak256(
    encodePacked(['address', 'bytes32'], [account.address, toHex(spendingPrivateKey)])
  );

  return {
    spendingPrivateKey,
    payoutAddress: account.address,
    metaAddressHash,
  };
}

const STORAGE_KEY = 'payshield_stealth_keys';

export function saveStealthKeyPair(payrollAddress: Address, keys: StealthKeyPair): void {
  if (typeof window === 'undefined') return;
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  stored[payrollAddress.toLowerCase()] = {
    spendingPrivateKey: keys.spendingPrivateKey,
    payoutAddress: keys.payoutAddress,
    metaAddressHash: keys.metaAddressHash,
    createdAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

export function loadStealthKeyPair(payrollAddress: Address): StealthKeyPair | null {
  if (typeof window === 'undefined') return null;
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  const entry = stored[payrollAddress.toLowerCase()];
  if (!entry) return null;
  return {
    spendingPrivateKey: entry.spendingPrivateKey,
    payoutAddress: entry.payoutAddress,
    metaAddressHash: entry.metaAddressHash,
  };
}
