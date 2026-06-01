import { defineChain, type Chain } from "viem";
import { arbitrumSepolia as viemArbitrumSepolia } from "viem/chains";

export const hardhatLocal = defineChain({
  id: 31337,
  name: "Hardhat Local",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
  },
  testnet: true,
});

export const fhenixLocalNode = defineChain({
  id: 412346,
  name: "Fhenix Local",
  nativeCurrency: { name: "FHE", symbol: "FHE", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:42069"],
    },
  },
  blockExplorers: {
    default: { name: "Fhenix Explorer", url: "http://localhost:3000" },
  },
  testnet: true,
});

export const fhenixHelium = defineChain({
  id: 8008135,
  name: "Fhenix Helium",
  nativeCurrency: { name: "tFHE", symbol: "tFHE", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.FHENIX_TESTNET_RPC_URL || "https://get-helium.fhenix.zone",
        "https://api.helium.fhenix.zone",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Fhenix Explorer",
      url: "https://explorer.helium.fhenix.zone",
    },
  },
  testnet: true,
});

export function getArbitrumSepoliaRpcUrl(): string {
  if (process.env.ARBITRUM_SEPOLIA_RPC_URL) {
    return process.env.ARBITRUM_SEPOLIA_RPC_URL;
  }
  if (
    process.env.NEXT_PUBLIC_CHAIN_ID === "421614" &&
    process.env.NEXT_PUBLIC_RPC_URL
  ) {
    return process.env.NEXT_PUBLIC_RPC_URL;
  }
  return "https://sepolia-rollup.arbitrum.io/rpc";
}

export const arbitrumSepolia: Chain = {
  ...viemArbitrumSepolia,
  rpcUrls: {
    default: {
      http: [getArbitrumSepoliaRpcUrl()],
    },
  },
};

/** Chain the app expects (from env). Defaults to Arbitrum Sepolia. */
export const TARGET_CHAIN_ID = parseInt(
  process.env.NEXT_PUBLIC_CHAIN_ID || String(arbitrumSepolia.id),
  10
);

export const SUPPORTED_CHAINS: readonly Chain[] = [
  arbitrumSepolia,
  hardhatLocal,
  fhenixLocalNode,
  fhenixHelium,
];

export function getTargetChain(): Chain {
  const match = SUPPORTED_CHAINS.find((c) => c.id === TARGET_CHAIN_ID);
  if (match) return match;

  return defineChain({
    id: TARGET_CHAIN_ID,
    name: `Chain ${TARGET_CHAIN_ID}`,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: {
      default: {
        http: [process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"],
      },
    },
    testnet: true,
  });
}

export function getChainName(chainId: number): string {
  const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
  if (chain) return chain.name;
  if (chainId === 1) return "Ethereum Mainnet";
  return `Chain ${chainId}`;
}

export function isMainnet(chainId: number): boolean {
  return chainId === 1;
}
