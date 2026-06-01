"use client";

import { createConfig, http } from "wagmi";
import { injected, metaMask } from "wagmi/connectors";
import {
  SUPPORTED_CHAINS,
  getTargetChain,
  TARGET_CHAIN_ID,
  hardhatLocal,
  fhenixLocalNode,
  fhenixHelium,
  arbitrumSepolia,
  getArbitrumSepoliaRpcUrl,
} from "./chains";

const targetChain = getTargetChain();

// Target chain first so wagmi prefers it for new connections
const chains = [
  targetChain,
  ...SUPPORTED_CHAINS.filter((c) => c.id !== targetChain.id),
] as const;

export const wagmiConfig = createConfig({
  chains,
  connectors: [injected(), metaMask()],
  transports: {
    [hardhatLocal.id]: http("http://127.0.0.1:8545"),
    [fhenixLocalNode.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:42069"
    ),
    [fhenixHelium.id]: http(
      process.env.FHENIX_TESTNET_RPC_URL ||
        process.env.NEXT_PUBLIC_RPC_URL ||
        "https://get-helium.fhenix.zone"
    ),
    [arbitrumSepolia.id]: http(getArbitrumSepoliaRpcUrl()),
  },
});

export { TARGET_CHAIN_ID, SUPPORTED_CHAINS, getTargetChain, getChainName } from "./chains";
