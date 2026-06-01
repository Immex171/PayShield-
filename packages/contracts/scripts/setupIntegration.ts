import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Full local integration setup:
 * deploy (if needed) → create payroll → faucet → fund vault → add worker → grant auditor
 *
 * Run: npx hardhat run scripts/setupIntegration.ts --network localhost
 */

function mockEncrypt(amount: bigint): string {
  return ethers.AbiCoder.defaultAbiCoder().encode(
    ["uint256", "uint8"],
    [amount, 0]
  );
}

async function main() {
  const signers = await ethers.getSigners();
  const companyAdmin = signers[1] ?? signers[0];
  const worker = signers[2] ?? signers[0];
  const auditor = signers[3] ?? signers[0];

  const deploymentPath = path.resolve(__dirname, "../deployments/latest.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("Run deploy.ts first");
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const factoryAddr = deployment.contracts.PayShieldFactory;
  const usdcAddr = deployment.contracts.MockUSDC;

  const factory = await ethers.getContractAt("PayShieldFactory", factoryAddr);
  const usdc = await ethers.getContractAt("MockUSDC", usdcAddr);

  console.log("\n► Integration setup");
  console.log(`  Company admin: ${companyAdmin.address}`);
  console.log(`  Worker:        ${worker.address}`);
  console.log(`  Auditor:       ${auditor.address}`);

  let payrollAddr = await factory.getPayroll(companyAdmin.address);
  if (payrollAddr === ethers.ZeroAddress) {
    console.log("\n► Creating payroll...");
    await (await factory.connect(companyAdmin).createPayroll(usdcAddr)).wait();
    payrollAddr = await factory.getPayroll(companyAdmin.address);
  }
  const vaultAddr = await factory.getVault(payrollAddr);
  const payroll = await ethers.getContractAt("PayShieldPayroll", payrollAddr);
  const vault = await ethers.getContractAt("PayShieldVault", vaultAddr);

  console.log(`  Payroll: ${payrollAddr}`);
  console.log(`  Vault:   ${vaultAddr}`);

  console.log("\n► Claiming test mUSDC...");
  try {
    await (await usdc.connect(companyAdmin).faucet()).wait();
  } catch {
    console.log("  (faucet cooldown — using existing balance)");
  }

  const fundAmount = BigInt(50_000 * 1e6);
  const vaultBal = await vault.getBalance();
  if (vaultBal < fundAmount) {
    console.log("► Funding vault...");
    await (await usdc.connect(companyAdmin).approve(vaultAddr, fundAmount)).wait();
    await (await vault.connect(companyAdmin).deposit(fundAmount)).wait();
  }

  const salary = BigInt(5_000 * 1e6);
  const isWorker = await payroll.isActiveWorker(worker.address);
  if (!isWorker) {
    console.log("► Adding worker with encrypted salary...");
    const idHash = ethers.keccak256(
      ethers.solidityPacked(["string", "address"], ["EMP-001", worker.address])
    );
    await (
      await payroll
        .connect(companyAdmin)
        .addWorker(worker.address, idHash, mockEncrypt(salary))
    ).wait();
  }

  const hasAuditor = await payroll.hasAuditorAccess(auditor.address);
  if (!hasAuditor) {
    console.log("► Granting auditor access...");
    await (await payroll.connect(companyAdmin).grantAuditorAccess(auditor.address)).wait();
  }

  const demoState = {
    payrollAddress: payrollAddr,
    vaultAddress: vaultAddr,
    companyAdmin: companyAdmin.address,
    worker: worker.address,
    auditor: auditor.address,
    workerCount: (await payroll.workerCount()).toString(),
    vaultBalance: (await vault.getBalance()).toString(),
  };

  fs.writeFileSync(
    path.join(path.dirname(deploymentPath), "demo-state.json"),
    JSON.stringify(demoState, null, 2)
  );

  const envSnippet = `
NEXT_PUBLIC_PAYSHIELD_FACTORY_ADDRESS=${factoryAddr}
NEXT_PUBLIC_MOCK_USDC_ADDRESS=${usdcAddr}
NEXT_PUBLIC_ACCESS_MANAGER_ADDRESS=${deployment.contracts.PayShieldAccessManager}
NEXT_PUBLIC_DEMO_PAYROLL_ADDRESS=${payrollAddr}
NEXT_PUBLIC_CHAIN_ID=${deployment.chainId}
NEXT_PUBLIC_RPC_URL=${process.env.NEXT_PUBLIC_RPC_URL || (deployment.chainId === "421614" ? "https://sepolia-rollup.arbitrum.io/rpc" : deployment.chainId === "8008135" ? "https://get-helium.fhenix.zone" : "http://127.0.0.1:8545")}
COFHE_GATEWAY_URL=${process.env.COFHE_GATEWAY_URL || "https://gateway.helium.fhenix.zone"}
`;

  fs.writeFileSync(path.join(path.dirname(deploymentPath), "env-snippet.txt"), envSnippet);

  const webEnv = path.resolve(__dirname, "../../../apps/web/.env.local");
  fs.writeFileSync(webEnv, envSnippet.trim() + "\n");

  console.log("\n✓ Integration setup complete");
  console.log(`✓ apps/web/.env.local updated`);
  console.log(`\nDemo payroll for worker portal: ${payrollAddr}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
