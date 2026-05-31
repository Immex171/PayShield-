import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
  PayShieldFactory,
  PayShieldPayroll,
  PayShieldAccessManager,
  MockUSDC,
} from "../typechain-types";

async function mockEncryptSalary(amount: bigint): Promise<string> {
  return ethers.AbiCoder.defaultAbiCoder().encode(
    ["tuple(uint256 ctHash, uint8 securityZone)"],
    [{ ctHash: amount, securityZone: 0 }]
  );
}

describe("PayShield Access Control — Unit Tests", function () {
  let companyAdmin: SignerWithAddress;
  let worker1: SignerWithAddress;
  let worker2: SignerWithAddress;
  let auditor: SignerWithAddress;
  let hacker: SignerWithAddress;
  let factory: PayShieldFactory;
  let accessManager: PayShieldAccessManager;
  let payroll: PayShieldPayroll;
  let mockUSDC: MockUSDC;

  const EMP_1 = ethers.keccak256(ethers.toUtf8Bytes("EMP-001"));
  const EMP_2 = ethers.keccak256(ethers.toUtf8Bytes("EMP-002"));

  before(async function () {
    [companyAdmin, worker1, worker2, auditor, hacker] =
      await ethers.getSigners();

    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDCFactory.deploy();
    await mockUSDC.waitForDeployment();
    await mockUSDC.mint(companyAdmin.address, BigInt(200_000 * 1e6));

    const AMFactory = await ethers.getContractFactory("PayShieldAccessManager");
    accessManager = await AMFactory.deploy();
    await accessManager.waitForDeployment();

    const FactoryContract = await ethers.getContractFactory("PayShieldFactory");
    factory = await FactoryContract.deploy(await accessManager.getAddress());
    await factory.waitForDeployment();
    await accessManager.transferOwnership(await factory.getAddress());

    const tx = await factory
      .connect(companyAdmin)
      .createPayroll(await mockUSDC.getAddress());
    await tx.wait();

    const payrollAddr = await factory.getPayroll(companyAdmin.address);
    payroll = await ethers.getContractAt(
      "PayShieldPayroll",
      payrollAddr
    ) as unknown as PayShieldPayroll;

    // Register workers
    await payroll
      .connect(companyAdmin)
      .addWorker(worker1.address, EMP_1, await mockEncryptSalary(BigInt(5000 * 1e6)));
    await payroll
      .connect(companyAdmin)
      .addWorker(worker2.address, EMP_2, await mockEncryptSalary(BigInt(7000 * 1e6)));
  });

  describe("Role checks via AccessManager", function () {
    it("company admin has COMPANY_ADMIN role", async function () {
      const payrollAddr = await payroll.getAddress();
      const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("COMPANY_ADMIN"));
      expect(
        await accessManager.hasRole(payrollAddr, ADMIN_ROLE, companyAdmin.address)
      ).to.be.true;
    });

    it("worker1 has WORKER role", async function () {
      const payrollAddr = await payroll.getAddress();
      const WORKER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("WORKER"));
      expect(
        await accessManager.hasRole(payrollAddr, WORKER_ROLE, worker1.address)
      ).to.be.true;
    });

    it("hacker has no roles", async function () {
      const payrollAddr = await payroll.getAddress();
      const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("COMPANY_ADMIN"));
      const WORKER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("WORKER"));
      const AUDITOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("AUDITOR"));

      expect(await accessManager.hasRole(payrollAddr, ADMIN_ROLE, hacker.address)).to.be.false;
      expect(await accessManager.hasRole(payrollAddr, WORKER_ROLE, hacker.address)).to.be.false;
      expect(await accessManager.hasRole(payrollAddr, AUDITOR_ROLE, hacker.address)).to.be.false;
    });
  });

  describe("FHE Salary Decryption Access", function () {
    it("worker can view their own salary (sealOutput permission)", async function () {
      const permission = { sealingKey: ethers.randomBytes(32) };
      // In the mock environment, this returns the encrypted value
      // On real Fhenix, this would return re-encrypted ciphertext for worker's key
      const result = await payroll
        .connect(worker1)
        .getSealedSalary(worker1.address, permission as any);
      expect(result).to.not.equal("0x");
    });

    it("worker cannot view another worker's salary", async function () {
      const permission = { sealingKey: ethers.randomBytes(32) };
      await expect(
        payroll
          .connect(worker2)
          .getSealedSalary(worker1.address, permission as any)
      ).to.be.revertedWithCustomError(payroll, "SalaryDecryptionNotPermitted");
    });

    it("company admin can view any worker salary", async function () {
      const permission = { sealingKey: ethers.randomBytes(32) };
      const result = await payroll
        .connect(companyAdmin)
        .getSealedSalary(worker1.address, permission as any);
      expect(result).to.not.equal("0x");
    });

    it("auditor cannot view salary without access grant", async function () {
      const permission = { sealingKey: ethers.randomBytes(32) };
      await expect(
        payroll
          .connect(auditor)
          .getSealedSalary(worker1.address, permission as any)
      ).to.be.revertedWithCustomError(payroll, "SalaryDecryptionNotPermitted");
    });

    it("auditor can view salary after access is granted", async function () {
      await payroll.connect(companyAdmin).grantAuditorAccess(auditor.address);
      const permission = { sealingKey: ethers.randomBytes(32) };
      const result = await payroll
        .connect(auditor)
        .getSealedSalary(worker1.address, permission as any);
      expect(result).to.not.equal("0x");
    });

    it("auditor cannot view after access is revoked", async function () {
      await payroll.connect(companyAdmin).revokeAuditorAccess(auditor.address);
      const permission = { sealingKey: ethers.randomBytes(32) };
      await expect(
        payroll
          .connect(auditor)
          .getSealedSalary(worker1.address, permission as any)
      ).to.be.revertedWithCustomError(payroll, "SalaryDecryptionNotPermitted");
    });
  });
});
