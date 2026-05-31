import { CHAIN_IDS } from "@payshield/shared/src/constants";

export interface ContractAddresses {
  payShieldFactory: `0x${string}`;
  mockUSDC: `0x${string}`;
  accessManager: `0x${string}`;
  /** Convenience aliases used by hooks */
  factory: `0x${string}`;
  mockUsdc: `0x${string}`;
}

const envFactory = (process.env.NEXT_PUBLIC_PAYSHIELD_FACTORY_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;
const envUsdc = (process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;
const envAccess = (process.env.NEXT_PUBLIC_ACCESS_MANAGER_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

function withAliases(base: Omit<ContractAddresses, "factory" | "mockUsdc">): ContractAddresses {
  return {
    ...base,
    factory: base.payShieldFactory,
    mockUsdc: base.mockUSDC,
  };
}

const sharedAddresses = {
  payShieldFactory: envFactory,
  mockUSDC: envUsdc,
  accessManager: envAccess,
};

const addresses: Record<number, ContractAddresses> = {
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: withAliases(sharedAddresses),
  [CHAIN_IDS.HARDHAT]: withAliases(sharedAddresses),
  [CHAIN_IDS.LOCAL_FHENIX]: withAliases(sharedAddresses),
  [CHAIN_IDS.FHENIX_HELIUM_TESTNET]: withAliases(sharedAddresses),
};

export function getContractAddresses(chainId: number): ContractAddresses {
  const addrs = addresses[chainId];
  if (!addrs) {
    console.warn(`No contract addresses found for chainId ${chainId}. Using env defaults.`);
    return withAliases({
      payShieldFactory: "0x0000000000000000000000000000000000000000",
      mockUSDC: "0x0000000000000000000000000000000000000000",
      accessManager: "0x0000000000000000000000000000000000000000",
    });
  }
  return addrs;
}

export const DEFAULT_CHAIN_ID = parseInt(
  process.env.NEXT_PUBLIC_CHAIN_ID || String(CHAIN_IDS.ARBITRUM_SEPOLIA)
);
