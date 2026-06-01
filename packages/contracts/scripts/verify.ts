import { run } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Verifies deployed PayShield contracts on the block explorer.
 *
 * Usage:
 *   npx hardhat run scripts/verify.ts --network fhenixTestnet
 *   npx hardhat run scripts/verify.ts --network arbitrumSepolia
 */
async function main() {
  const deploymentPath = path.resolve(__dirname, "../deployments/latest.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("No deployment found. Run deploy.ts first.");
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const { MockUSDC, PayShieldAccessManager, PayShieldFactory } = deployment.contracts;

  console.log("\n► Verifying PayShield contracts...\n");

  await run("verify:verify", {
    address: MockUSDC,
    constructorArguments: [],
  });
  console.log(`  ✓ MockUSDC: ${MockUSDC}`);

  await run("verify:verify", {
    address: PayShieldAccessManager,
    constructorArguments: [],
  });
  console.log(`  ✓ AccessManager: ${PayShieldAccessManager}`);

  await run("verify:verify", {
    address: PayShieldFactory,
    constructorArguments: [PayShieldAccessManager],
  });
  console.log(`  ✓ Factory: ${PayShieldFactory}`);

  console.log("\n✓ Verification complete\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
