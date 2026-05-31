import { ethers } from "hardhat";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * workerClaim.test.ts
 *
 * End-to-end tests for the worker salary claim flow.
 * Covers the full lifecycle: deploy → fund → add worker → claim.
 */

describe("Worker Claim Flow", function () {
  let admin: HardhatEthersSigner;
  let worker: HardhatEthersSigner;
  let worker2: HardhatEthersSigner;
  let stranger: HardhatEthersSigner;

  let payroll: any;
  let vault: any;
  let usdc: any;

  const SALARY = 3_000_000_000n;    // 3000 USDC
  const VAULT_FUND = 30_000_000_000n; // 30,000 USDC

  function mockEncrypt(value: bigint): string {
    const ctHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(["uint128"], [value])
    );
    return ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes32", "uint8"],
      [ctHash, 0]
    );
  }

  beforeEach(async function () {
    [admin, worker, worker2, stranger] = await ethers.getSigners();

    // Deploy fresh set of contracts for each test
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy("Mock USDC", "mUSDC", 6);
    await usdc.mint(admin.address, 1_000_000_000_000n); // 1M USDC to admin

    const AccessManager = await ethers.getContractFactory("PayShieldAccessManager");
    const accessManager = await AccessManager.deploy(admin.address);

    const Factory = await ethers.getContractFactory("PayShieldFactory");
    const factory = await Factory.deploy(await accessManager.getAddress());

    const tx = await factory.connect(admin).createPayroll("Claim Test Corp", await usdc.getAddress());
    const receipt = await tx.wait();

    const event = receipt?.logs?.find((log: any) => log.eventName === "PayrollCreated");
    const payrollAddress = event?.args?.payroll ?? receipt?.logs?.[0]?.address;

    const Payroll = await ethers.getContractFactory("PayShieldPayroll");
    payroll = Payroll.attach(payrollAddress);
    const vaultAddress = await payroll.vaultAddress();
    const Vault = await ethers.getContractFactory("PayShieldVault");
    vault = Vault.attach(vaultAddress);

    // Fund vault
    await usdc.connect(admin).approve(await vault.getAddress(), VAULT_FUND);
    await payroll.connect(admin).fundPayroll(VAULT_FUND);

    // Add worker
    const idHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["string", "address"],
        ["test-worker-001", worker.address]
      )
    );
    await payroll.connect(admin).addWorker(worker.address, idHash, mockEncrypt(SALARY));
  });

  describe("Happy path: worker claims salary", function () {
    it("should transfer USDC to worker on successful claim", async function () {
      const before = await usdc.balanceOf(worker.address);
      await payroll.connect(worker).claimSalary();
      const after = await usdc.balanceOf(worker.address);

      // Worker should receive their salary amount
      expect(after - before).to.equal(SALARY);
    });

    it("should update worker's lastClaimTime after claim", async function () {
      await payroll.connect(worker).claimSalary();
      const info = await payroll.getWorkerInfo(worker.address);
      expect(info.lastClaimTime).to.be.gt(0n);
    });

    it("should update worker's claimedAmount after claim", async function () {
      await payroll.connect(worker).claimSalary();
      const info = await payroll.getWorkerInfo(worker.address);
      expect(info.claimedAmount).to.be.gte(SALARY);
    });

    it("should emit SalaryClaimed event without amount", async function () {
      const tx = await payroll.connect(worker).claimSalary();
      const receipt = await tx.wait();

      const claimEvent = receipt?.logs?.find(
        (log: any) => log.eventName === "SalaryClaimed"
      );

      expect(claimEvent).to.exist;
      // Privacy check: no salary amount in event
      if (claimEvent) {
        expect(claimEvent.args).to.not.have.property("amount");
        expect(claimEvent.args).to.not.have.property("salary");
      }
    });

    it("should reduce vault balance by salary amount", async function () {
      const vaultBefore = await usdc.balanceOf(await vault.getAddress());
      await payroll.connect(worker).claimSalary();
      const vaultAfter = await usdc.balanceOf(await vault.getAddress());

      expect(vaultBefore - vaultAfter).to.equal(SALARY);
    });
  });

  describe("Claim restrictions", function () {
    it("unregistered address cannot claim", async function () {
      await expect(
        payroll.connect(stranger).claimSalary()
      ).to.be.reverted;
    });

    it("inactive worker cannot claim", async function () {
      await payroll.connect(admin).setWorkerStatus(worker.address, false);
      await expect(
        payroll.connect(worker).claimSalary()
      ).to.be.reverted;
    });

    it("cannot claim twice in the same period", async function () {
      await payroll.connect(worker).claimSalary();
      // Second claim in same period should revert
      await expect(
        payroll.connect(worker).claimSalary()
      ).to.be.reverted;
    });

    it("admin cannot claim as worker", async function () {
      await expect(
        payroll.connect(admin).claimSalary()
      ).to.be.reverted;
    });
  });

  describe("Vault solvency", function () {
    it("claim fails if vault is empty", async function () {
      // Deploy fresh unfunded payroll
      const MockUSDC2 = await ethers.getContractFactory("MockUSDC");
      const usdc2 = await MockUSDC2.deploy("Mock USDC2", "mUSDC2", 6);

      const AccessManager2 = await ethers.getContractFactory("PayShieldAccessManager");
      const am2 = await AccessManager2.deploy(admin.address);

      const Factory2 = await ethers.getContractFactory("PayShieldFactory");
      const factory2 = await Factory2.deploy(await am2.getAddress());

      const tx = await factory2.connect(admin).createPayroll("Empty Corp", await usdc2.getAddress());
      const receipt = await tx.wait();
      const event = receipt?.logs?.find((log: any) => log.eventName === "PayrollCreated");
      const payrollAddr = event?.args?.payroll ?? receipt?.logs?.[0]?.address;

      const Payroll2 = await ethers.getContractFactory("PayShieldPayroll");
      const payroll2 = Payroll2.attach(payrollAddr);

      // Add worker but don't fund vault
      const idHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["string", "address"],
          ["broke-worker", worker.address]
        )
      );
      await payroll2.connect(admin).addWorker(worker.address, idHash, mockEncrypt(SALARY));

      await expect(
        payroll2.connect(worker).claimSalary()
      ).to.be.reverted;
    });

    it("multiple workers can each claim their own salary", async function () {
      // Add second worker
      const idHash2 = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["string", "address"],
          ["worker2-001", worker2.address]
        )
      );
      await payroll.connect(admin).addWorker(worker2.address, idHash2, mockEncrypt(SALARY));

      const before1 = await usdc.balanceOf(worker.address);
      const before2 = await usdc.balanceOf(worker2.address);

      await payroll.connect(worker).claimSalary();
      await payroll.connect(worker2).claimSalary();

      const after1 = await usdc.balanceOf(worker.address);
      const after2 = await usdc.balanceOf(worker2.address);

      expect(after1 - before1).to.equal(SALARY);
      expect(after2 - before2).to.equal(SALARY);
    });
  });

  describe("Worker status management", function () {
    it("admin can deactivate worker", async function () {
      await payroll.connect(admin).setWorkerStatus(worker.address, false);
      const info = await payroll.getWorkerInfo(worker.address);
      expect(info.isActive).to.equal(false);
    });

    it("admin can reactivate worker", async function () {
      await payroll.connect(admin).setWorkerStatus(worker.address, false);
      await payroll.connect(admin).setWorkerStatus(worker.address, true);
      const info = await payroll.getWorkerInfo(worker.address);
      expect(info.isActive).to.equal(true);
    });

    it("non-admin cannot change worker status", async function () {
      await expect(
        payroll.connect(stranger).setWorkerStatus(worker.address, false)
      ).to.be.reverted;
    });

    it("worker cannot change their own status", async function () {
      await expect(
        payroll.connect(worker).setWorkerStatus(worker.address, true)
      ).to.be.reverted;
    });
  });

  describe("Emergency controls", function () {
    it("admin can pause payroll", async function () {
      await payroll.connect(admin).pause();
      expect(await payroll.paused()).to.equal(true);
    });

    it("claiming is blocked when paused", async function () {
      await payroll.connect(admin).pause();
      await expect(
        payroll.connect(worker).claimSalary()
      ).to.be.reverted;
    });

    it("admin can unpause payroll", async function () {
      await payroll.connect(admin).pause();
      await payroll.connect(admin).unpause();
      expect(await payroll.paused()).to.equal(false);
    });

    it("claiming resumes after unpause", async function () {
      await payroll.connect(admin).pause();
      await payroll.connect(admin).unpause();

      const before = await usdc.balanceOf(worker.address);
      await payroll.connect(worker).claimSalary();
      const after = await usdc.balanceOf(worker.address);
      expect(after - before).to.equal(SALARY);
    });

    it("non-admin cannot pause", async function () {
      await expect(
        payroll.connect(stranger).pause()
      ).to.be.reverted;
    });
  });
});
