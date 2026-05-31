import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@cofhe/hardhat-plugin";
import * as dotenv from "dotenv";
import path from "path";

// Load env from monorepo root
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.example") });

const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const COMPANY_KEY = process.env.COMPANY_ADMIN_PRIVATE_KEY || "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const WORKER_KEY = process.env.WORKER_PRIVATE_KEY || "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";
const AUDITOR_KEY = process.env.AUDITOR_PRIVATE_KEY || "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.25",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: [DEPLOYER_KEY, COMPANY_KEY, WORKER_KEY, AUDITOR_KEY],
    },
    // Local Fhenix node (run: npx fhenix-localfhenix)
    localfhenix: {
      url: process.env.LOCAL_FHENIX_RPC_URL || "http://127.0.0.1:42069",
      chainId: 412346,
      accounts: [DEPLOYER_KEY, COMPANY_KEY, WORKER_KEY, AUDITOR_KEY],
      gas: "auto",
      gasPrice: "auto",
    },
    // Fhenix Helium testnet
    fhenixTestnet: {
      url: process.env.FHENIX_TESTNET_RPC_URL || "https://api.helium.fhenix.zone",
      chainId: 8008135,
      accounts: [DEPLOYER_KEY],
      gas: "auto",
      gasPrice: "auto",
    },
    // Arbitrum Sepolia
    arbitrumSepolia: {
      url:
        process.env.ARBITRUM_SEPOLIA_RPC_URL ||
        "https://sepolia-rollup.arbitrum.io/rpc",
      chainId: 421614,
      accounts: [DEPLOYER_KEY],
      gas: "auto",
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  typechain: {
    outDir: "./typechain-types",
    target: "ethers-v6",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
  },
};

export default config;
