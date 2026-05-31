import { ethers } from "hardhat";
import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  // CoFHE mock contracts must exist at fixed addresses before PayShield deploys.
  if (hre.network.name === "hardhat") {
    await hre.cofhe.mocks.deployMocks({ deployTestBed: false });
  }

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║         PayShield — Contract Deployment              ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log(`  Network:  ${network.name} (chainId: ${network.chainId})`);
  console.log(`  Deployer: ${deployer.address}`);
  console.log(`  Balance:  ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // ─── 1. Deploy MockUSDC ───────────────────────────────────────────
  console.log("► Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  const mockUSDCAddr = await mockUSDC.getAddress();
  console.log(`  ✓ MockUSDC:             ${mockUSDCAddr}`);

  // ─── 2. Deploy AccessManager ─────────────────────────────────────
  console.log("► Deploying PayShieldAccessManager...");
  const AccessManager = await ethers.getContractFactory("PayShieldAccessManager");
  const accessManager = await AccessManager.deploy();
  await accessManager.waitForDeployment();
  const accessManagerAddr = await accessManager.getAddress();
  console.log(`  ✓ AccessManager:        ${accessManagerAddr}`);

  // ─── 3. Deploy Factory ────────────────────────────────────────────
  console.log("► Deploying PayShieldFactory...");
  const Factory = await ethers.getContractFactory("PayShieldFactory");
  const factory = await Factory.deploy(accessManagerAddr);
  await factory.waitForDeployment();
  const factoryAddr = await factory.getAddress();
  console.log(`  ✓ PayShieldFactory:     ${factoryAddr}`);

  // ─── 4. Transfer AccessManager ownership to Factory ──────────────
  console.log("► Transferring AccessManager ownership to Factory...");
  const transferTx = await accessManager.transferOwnership(factoryAddr);
  await transferTx.wait();
  console.log(`  ✓ AccessManager owner → Factory`);

  // ─── 5. Write deployment artifacts ───────────────────────────────
  const addresses = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      MockUSDC: mockUSDCAddr,
      PayShieldAccessManager: accessManagerAddr,
      PayShieldFactory: factoryAddr,
    },
  };

  const artifactsDir = path.resolve(__dirname, "../deployments");
  if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });

  const filename = `deployment-${network.chainId}-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(artifactsDir, filename),
    JSON.stringify(addresses, null, 2)
  );

  // Also write latest.json for easy access
  fs.writeFileSync(
    path.join(artifactsDir, "latest.json"),
    JSON.stringify(addresses, null, 2)
  );

  // Write .env snippet
  const envSnippet = `
# PayShield Contract Addresses — ${network.name} (${new Date().toISOString()})
NEXT_PUBLIC_PAYSHIELD_FACTORY_ADDRESS=${factoryAddr}
NEXT_PUBLIC_MOCK_USDC_ADDRESS=${mockUSDCAddr}
NEXT_PUBLIC_ACCESS_MANAGER_ADDRESS=${accessManagerAddr}
NEXT_PUBLIC_CHAIN_ID=${network.chainId}
NEXT_PUBLIC_RPC_URL=${process.env.NEXT_PUBLIC_RPC_URL || (network.chainId === 412346n ? "http://127.0.0.1:42069" : network.chainId === 31337n ? "http://127.0.0.1:8545" : network.chainId === 421614n ? "https://sepolia-rollup.arbitrum.io/rpc" : "https://api.helium.fhenix.zone")}
`;
  fs.writeFileSync(path.join(artifactsDir, "env-snippet.txt"), envSnippet);

  console.log(`\n  ✓ Deployment artifacts → deployments/${filename}`);
  console.log(`  ✓ env-snippet.txt written — copy to apps/web/.env.local\n`);
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║                Deployment Complete                   ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  return addresses;
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
