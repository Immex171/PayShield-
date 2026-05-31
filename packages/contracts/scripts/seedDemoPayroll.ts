import { ethers } from "hardhat";
import hre from "hardhat";
import { Encryptable } from "@cofhe/sdk";
import * as fs from "fs";
import * as path from "path";

/**
 * seedDemoPayroll.ts
 * Sets up a complete demo scenario for judges:
 *   - Company admin creates payroll
 *   - Adds 3 workers with encrypted salaries
 *   - Funds vault with 50,000 mUSDC
 *   - Grants auditor access
 *
 * Run after deploy.ts:
 *   npx hardhat run scripts/seedDemoPayroll.ts --network localhost
 */

async function encryptSalary(
  signer: Awaited<ReturnType<typeof ethers.getSigners>>[number],
  amount: bigint
): Promise<string> {
  const client = await hre.cofhe.createClientWithBatteries(signer);
  const network = await ethers.provider.getNetwork();
  const [encrypted] = await client
    .encryptInputs([Encryptable.uint128(amount)])
    .setChainId(Number(network.chainId))
    .execute();

  return ethers.AbiCoder.defaultAbiCoder().encode(
    ["uint256", "uint8", "uint8", "bytes"],
    [encrypted.ctHash, encrypted.securityZone, encrypted.utype, encrypted.signature]
  );
}

async function main() {
  const [deployer, companyAdmin, worker1, worker2, worker3, auditor] =
    await ethers.getSigners();

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║       PayShield — Demo Data Seeding                  ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  // Load deployment addresses
  const deploymentPath = path.resolve(__dirname, "../deployments/latest.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("No deployment found. Run deploy.ts first.");
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const { MockUSDC: mockUSDCAddr, PayShieldFactory: factoryAddr } = deployment.contracts;

  console.log(`Using deployment from: ${deployment.deployedAt}`);
  console.log(`Factory: ${factoryAddr}`);
  console.log(`MockUSDC: ${mockUSDCAddr}\n`);

  const factory = await ethers.getContractAt("PayShieldFactory", factoryAddr);
  const mockUSDC = await ethers.getContractAt("MockUSDC", mockUSDCAddr);

  // Mint tokens to company admin
  console.log("► Minting 200,000 mUSDC to company admin...");
  await mockUSDC.connect(deployer).mint(
    companyAdmin.address,
    BigInt(200_000 * 1e6)
  );

  // Create payroll (or reuse existing demo payroll for company admin)
  let payrollAddr = await factory.getPayroll(companyAdmin.address);
  let payroll;
  let vaultAddr: string;

  if (payrollAddr === ethers.ZeroAddress) {
    console.log("► Company admin creating payroll...");
    const createTx = await factory
      .connect(companyAdmin)
      .createPayroll(mockUSDCAddr);
    await createTx.wait();
    payrollAddr = await factory.getPayroll(companyAdmin.address);
  } else {
    console.log("► Reusing existing payroll for company admin...");
  }

  payroll = await ethers.getContractAt("PayShieldPayroll", payrollAddr);
  vaultAddr = await factory.getVault(payrollAddr);
  const vault = await ethers.getContractAt("PayShieldVault", vaultAddr);
  console.log(`  ✓ Payroll: ${payrollAddr}`);
  console.log(`  ✓ Vault:   ${vaultAddr}`);

  // Add workers
  console.log("\n► Adding workers with encrypted salaries...");
  const workers = [
    { signer: worker1, emp: "EMP-001", label: "Alice (Senior Engineer)", salary: BigInt(8_500 * 1e6) },
    { signer: worker2, emp: "EMP-002", label: "Bob (Product Manager)", salary: BigInt(7_200 * 1e6) },
    { signer: worker3, emp: "EMP-003", label: "Carol (Designer)", salary: BigInt(5_800 * 1e6) },
  ];

  for (const w of workers) {
    const isRegistered = await payroll.isActiveWorker(w.signer.address);
    if (isRegistered) {
      console.log(`  ↷ ${w.label}: already registered`);
      continue;
    }
    const encSalary = await encryptSalary(companyAdmin, w.salary);
    await payroll.connect(companyAdmin).addWorker(
      w.signer.address,
      ethers.keccak256(ethers.toUtf8Bytes(w.emp)),
      encSalary
    );
    console.log(`  ✓ ${w.label}: ${w.signer.address}`);
    console.log(`    Encrypted salary stored on-chain (plaintext never revealed in tx)`);
  }

  // Fund vault
  const fundAmount = BigInt(50_000 * 1e6);
  console.log(`\n► Funding vault with ${fundAmount / BigInt(1e6)} mUSDC...`);
  await mockUSDC.connect(companyAdmin).approve(vaultAddr, fundAmount);
  await vault.connect(companyAdmin).deposit(fundAmount);
  console.log(`  ✓ Vault balance: ${(await vault.getBalance()) / BigInt(1e6)} mUSDC`);

  // Grant auditor access
  console.log(`\n► Granting auditor access to ${auditor.address}...`);
  await payroll.connect(companyAdmin).grantAuditorAccess(auditor.address);
  console.log(`  ✓ Auditor granted`);

  // Write demo state
  const demoState = {
    seededAt: new Date().toISOString(),
    payrollAddress: payrollAddr,
    vaultAddress: vaultAddr,
    companyAdmin: companyAdmin.address,
    workers: workers.map((w) => ({
      address: w.signer.address,
      employeeId: w.emp,
      label: w.label,
      // Note: salary NOT included here — stays encrypted
    })),
    auditor: auditor.address,
    vaultFunded: fundAmount.toString(),
  };

  fs.writeFileSync(
    path.join(path.dirname(deploymentPath), "demo-state.json"),
    JSON.stringify(demoState, null, 2)
  );

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║              Demo Seeding Complete                   ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log("\nDemo is ready. Open the app and connect wallet.");
  console.log("Workers can connect and claim their private salaries.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
