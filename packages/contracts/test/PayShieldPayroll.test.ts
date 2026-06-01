import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
  PayShieldFactory,
  PayShieldPayroll,
  PayShieldVault,
  PayShieldAccessManager,
  MockUSDC,
} from "../typechain-types";

// ─── CoFHE Mock Helper ────────────────────────────────────────────────────
// In the local CoFHE mock environment, we simulate encryption by encoding
// the plaintext value. The mock FHE library accepts this format and stores
// the value as if it were encrypted.
// On real Fhenix, the client would call cofheClient.encrypt_uint128(amount)
// which returns a proper ciphertext + proof bundle.

interface InEuint128Mock {
  ctHash: bigint;
  securityZone: number;
}

async function mockEncryptSalary(amount: bigint): Promise<string> {
  // In the CoFHE mock, InEuint128 is just the value encoded
  // Real implementation uses @cofhejs/cofhe encrypt methods
  const mockInput: InEuint128Mock = {
    ctHash: amount,
    securityZone: 0,
  };
  return ethers.AbiCoder.defaultAbiCoder().encode(
    ["tuple(uint256 ctHash, uint8 securityZone)"],
    [mockInput]
  );
}

/** Async CoFHE claim: prepare decrypt → advance time → claim */
async function claimWithDecrypt(
  payroll: PayShieldPayroll,
  worker: SignerWithAddress
) {
  await payroll.connect(worker).prepareClaimDecrypt();
  // Mock TaskManager adds 1–10s delay before decrypt result is readable
  await ethers.provider.send("evm_increaseTime", [12]);
  await ethers.provider.send("evm_mine", []);
  return payroll.connect(worker).claimSalary();
}

describe("PayShield — Full Test Suite", function () {
  // ─── Signers ───────────────────────────────────────────────────────
  let deployer: SignerWithAddress;
  let companyAdmin: SignerWithAddress;
  let worker1: SignerWithAddress;
  let worker2: SignerWithAddress;
  let auditor: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  // ─── Contracts ────────────────────────────────────────────────────
  let factory: PayShieldFactory;
  let accessManager: PayShieldAccessManager;
  let mockUSDC: MockUSDC;
  let payroll: PayShieldPayroll;
  let vault: PayShieldVault;

  // ─── Constants ────────────────────────────────────────────────────
  const SALARY_1 = BigInt(5_000 * 1e6); // 5,000 USDC (6 decimals)
  const SALARY_2 = BigInt(8_000 * 1e6); // 8,000 USDC
  const FUND_AMOUNT = BigInt(50_000 * 1e6); // 50,000 USDC
  const EMPLOYEE_ID_1 = ethers.keccak256(ethers.toUtf8Bytes("EMP-001"));
  const EMPLOYEE_ID_2 = ethers.keccak256(ethers.toUtf8Bytes("EMP-002"));

  before(async function () {
    [deployer, companyAdmin, worker1, worker2, auditor, unauthorized] =
      await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDCFactory.deploy();
    await mockUSDC.waitForDeployment();

    // Distribute tokens
    const usdcAmount = BigInt(200_000 * 1e6);
    await mockUSDC.mint(companyAdmin.address, usdcAmount);
    await mockUSDC.mint(deployer.address, usdcAmount);

    // Deploy AccessManager
    const AccessManagerFactory = await ethers.getContractFactory("PayShieldAccessManager");
    accessManager = await AccessManagerFactory.deploy();
    await accessManager.waitForDeployment();

    // Deploy Factory
    const FactoryContract = await ethers.getContractFactory("PayShieldFactory");
    factory = await FactoryContract.deploy(await accessManager.getAddress());
    await factory.waitForDeployment();

    // Transfer AccessManager ownership to factory
    await accessManager.transferOwnership(await factory.getAddress());
  });

  // ══════════════════════════════════════════════════════════════════
  // 1. FACTORY & PAYROLL CREATION
  // ══════════════════════════════════════════════════════════════════

  describe("1. Factory — Payroll Creation", function () {
    it("company can create a payroll contract", async function () {
      const tx = await factory.connect(companyAdmin).createPayroll(
        await mockUSDC.getAddress()
      );
      const receipt = await tx.wait();

      // Extract addresses from events
      const event = receipt?.logs.find((log) => {
        try {
          const parsed = factory.interface.parseLog(log as any);
          return parsed?.name === "PayrollCreated";
        } catch { return false; }
      });
      expect(event).to.not.be.undefined;

      const payrollAddress = await factory.getPayroll(companyAdmin.address);
      expect(payrollAddress).to.not.equal(ethers.ZeroAddress);

      // Connect to deployed contracts
      payroll = await ethers.getContractAt(
        "PayShieldPayroll",
        payrollAddress
      ) as unknown as PayShieldPayroll;
      vault = await ethers.getContractAt(
        "PayShieldVault",
        await factory.getVault(payrollAddress)
      ) as unknown as PayShieldVault;
    });

    it("company admin is correctly set in payroll", async function () {
      expect(await payroll.companyAdmin()).to.equal(companyAdmin.address);
    });

    it("vault is linked to payroll", async function () {
      expect(await vault.authorizedPayroll()).to.equal(await payroll.getAddress());
    });

    it("factory registers total payrolls correctly", async function () {
      expect(await factory.totalPayrolls()).to.equal(1);
    });

    it("second createPayroll for same company reverts", async function () {
      await expect(
        factory.connect(companyAdmin).createPayroll(await mockUSDC.getAddress())
      ).to.be.revertedWithCustomError(factory, "PayrollAlreadyExists");
    });

    it("createPayroll with zero token address reverts", async function () {
      const [, , , , , , newAdmin] = await ethers.getSigners().catch(() => [
        null, null, null, null, null, null, deployer
      ]);
      await expect(
        factory.connect(deployer).createPayroll(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(factory, "InvalidWorkerAddress");
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // 2. WORKER REGISTRATION
  // ══════════════════════════════════════════════════════════════════

  describe("2. Worker Registration", function () {
    it("company admin can add a worker with encrypted salary", async function () {
      const encSalary = await mockEncryptSalary(SALARY_1);
      const tx = await payroll
        .connect(companyAdmin)
        .addWorker(worker1.address, EMPLOYEE_ID_1, encSalary);
      const receipt = await tx.wait();

      // Check WorkerRegistered event
      const iface = payroll.interface;
      const event = receipt?.logs.find((log) => {
        try { return iface.parseLog(log as any)?.name === "WorkerRegistered"; }
        catch { return false; }
      });
      expect(event).to.not.be.undefined;
    });

    it("worker record metadata is correctly stored", async function () {
      const record = await payroll.getWorkerRecord(worker1.address);
      expect(record.workerAddress).to.equal(worker1.address);
      expect(record.employeeIdHash).to.equal(EMPLOYEE_ID_1);
      expect(record.status).to.equal(1); // Active
      expect(record.claimCount).to.equal(0);
    });

    it("worker is active after registration", async function () {
      expect(await payroll.isActiveWorker(worker1.address)).to.be.true;
    });

    it("non-admin cannot add a worker", async function () {
      const encSalary = await mockEncryptSalary(SALARY_2);
      await expect(
        payroll.connect(unauthorized).addWorker(
          worker2.address,
          EMPLOYEE_ID_2,
          encSalary
        )
      ).to.be.revertedWithCustomError(payroll, "NotCompanyAdmin");
    });

    it("cannot register the same worker twice", async function () {
      const encSalary = await mockEncryptSalary(SALARY_1);
      await expect(
        payroll.connect(companyAdmin).addWorker(
          worker1.address,
          EMPLOYEE_ID_1,
          encSalary
        )
      ).to.be.revertedWithCustomError(payroll, "WorkerAlreadyRegistered");
    });

    it("empty encrypted salary reverts", async function () {
      const [, , , , , , fresh] = await ethers.getSigners().catch(() => [null, null, null, null, null, null, deployer]);
      await expect(
        payroll.connect(companyAdmin).addWorker(
          (fresh || deployer).address,
          ethers.keccak256(ethers.toUtf8Bytes("EMP-FRESH")),
          "0x" // empty
        )
      ).to.be.reverted;
    });

    it("can add a second worker", async function () {
      const encSalary = await mockEncryptSalary(SALARY_2);
      await payroll
        .connect(companyAdmin)
        .addWorker(worker2.address, EMPLOYEE_ID_2, encSalary);
      expect(await payroll.workerCount()).to.equal(2);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // 3. ENCRYPTED SALARY PRIVACY
  // ══════════════════════════════════════════════════════════════════

  describe("3. Encrypted Salary Privacy", function () {
    it("encrypted salary is not stored as plaintext in contract state", async function () {
      // The contract storage slot for _encryptedSalaries stores only euint128 handles
      // We verify that reading the worker record reveals NO plaintext salary field
      const record = await payroll.getWorkerRecord(worker1.address);

      // WorkerRecord has no salary field — confirm
      const recordKeys = Object.keys(record);
      expect(recordKeys).to.not.include("salary");
      expect(recordKeys).to.not.include("salaryAmount");
    });

    it("unauthorized user cannot decrypt another worker's salary", async function () {
      // Permission object required by FHE.sealOutput
      const fakePermission = {
        sealingKey: ethers.randomBytes(32),
      };

      await expect(
        payroll
          .connect(unauthorized)
          .getSealedSalary(worker1.address, fakePermission as any)
      ).to.be.revertedWithCustomError(payroll, "SalaryDecryptionNotPermitted");
    });

    it("worker2 cannot view worker1 salary", async function () {
      const fakePermission = { sealingKey: ethers.randomBytes(32) };
      await expect(
        payroll
          .connect(worker2)
          .getSealedSalary(worker1.address, fakePermission as any)
      ).to.be.revertedWithCustomError(payroll, "SalaryDecryptionNotPermitted");
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // 4. SALARY UPDATE
  // ══════════════════════════════════════════════════════════════════

  describe("4. Salary Updates", function () {
    const UPDATED_SALARY = BigInt(6_500 * 1e6);

    it("company admin can update encrypted salary", async function () {
      const encSalary = await mockEncryptSalary(UPDATED_SALARY);
      const tx = await payroll
        .connect(companyAdmin)
        .updateWorkerSalary(worker1.address, encSalary);
      await expect(tx).to.emit(payroll, "SalaryUpdated");
    });

    it("non-admin cannot update salary", async function () {
      const encSalary = await mockEncryptSalary(BigInt(1000));
      await expect(
        payroll.connect(worker1).updateWorkerSalary(worker1.address, encSalary)
      ).to.be.revertedWithCustomError(payroll, "NotCompanyAdmin");
    });

    it("cannot update salary for unregistered worker", async function () {
      const encSalary = await mockEncryptSalary(BigInt(1000));
      await expect(
        payroll
          .connect(companyAdmin)
          .updateWorkerSalary(unauthorized.address, encSalary)
      ).to.be.revertedWithCustomError(payroll, "WorkerNotRegistered");
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // 5. VAULT FUNDING
  // ══════════════════════════════════════════════════════════════════

  describe("5. Vault Funding", function () {
    it("company admin can fund the vault", async function () {
      await mockUSDC.connect(companyAdmin).approve(
        await vault.getAddress(),
        FUND_AMOUNT
      );
      const tx = await vault.connect(companyAdmin).deposit(FUND_AMOUNT);
      await expect(tx).to.emit(vault, "VaultFunded");
      expect(await vault.getBalance()).to.equal(FUND_AMOUNT);
    });

    it("vault balance is correctly reported", async function () {
      expect(await vault.getBalance()).to.equal(FUND_AMOUNT);
    });

    it("deposit of zero amount reverts", async function () {
      await expect(
        vault.connect(companyAdmin).deposit(0)
      ).to.be.revertedWithCustomError(vault, "ZeroAmount");
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // 6. WORKER CLAIM
  // ══════════════════════════════════════════════════════════════════

  describe("6. Worker Salary Claim", function () {
    it("active worker can claim their salary", async function () {
      const workerBalanceBefore = await mockUSDC.balanceOf(worker1.address);
      const tx = await claimWithDecrypt(payroll, worker1);
      await expect(tx).to.emit(payroll, "SalaryClaimed");

      // Worker should have received their salary
      const workerBalanceAfter = await mockUSDC.balanceOf(worker1.address);
      expect(workerBalanceAfter).to.be.greaterThan(workerBalanceBefore);
    });

    it("worker cannot double-claim in same period", async function () {
      await expect(
        payroll.connect(worker1).claimSalary()
      ).to.be.revertedWithCustomError(payroll, "AlreadyClaimed");
    });

    it("worker can claim again after period advances", async function () {
      await payroll.connect(companyAdmin).advancePeriod();
      const tx = await claimWithDecrypt(payroll, worker1);
      await expect(tx).to.emit(payroll, "SalaryClaimed");
    });

    it("unregistered address cannot claim", async function () {
      await expect(
        payroll.connect(unauthorized).claimSalary()
      ).to.be.revertedWithCustomError(payroll, "WorkerNotRegistered");
    });

    it("vault cannot release funds if underfunded", async function () {
      // Drain vault via worker2 claiming
      await claimWithDecrypt(payroll, worker2);

      // Deploy fresh payroll with zero-funded vault
      const [freshAdmin] = [deployer];
      await mockUSDC.mint(freshAdmin.address, BigInt(100 * 1e6));

      const tx2 = await factory.connect(freshAdmin).createPayroll(
        await mockUSDC.getAddress()
      );
      await tx2.wait();
      const freshPayrollAddr = await factory.getPayroll(freshAdmin.address);
      const freshPayroll = await ethers.getContractAt(
        "PayShieldPayroll",
        freshPayrollAddr
      ) as unknown as PayShieldPayroll;

      // Add a worker with high salary
      const highSalary = await mockEncryptSalary(BigInt(9_999_999 * 1e6));
      await freshPayroll.connect(freshAdmin).addWorker(
        worker1.address,
        EMPLOYEE_ID_1,
        highSalary
      );

      // Don't fund the vault — claim should revert
      await expect(claimWithDecrypt(freshPayroll, worker1)).to.be.revertedWithCustomError(
        freshPayroll,
        "InsufficientVaultBalance"
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // 7. WORKER STATUS MANAGEMENT
  // ══════════════════════════════════════════════════════════════════

  describe("7. Worker Status", function () {
    it("company admin can deactivate a worker", async function () {
      const tx = await payroll
        .connect(companyAdmin)
        .setWorkerStatus(worker2.address, false);
      await expect(tx).to.emit(payroll, "WorkerStatusChanged");
      expect(await payroll.isActiveWorker(worker2.address)).to.be.false;
    });

    it("inactive worker cannot claim salary", async function () {
      await payroll.connect(companyAdmin).advancePeriod();
      await expect(
        payroll.connect(worker2).claimSalary()
      ).to.be.revertedWithCustomError(payroll, "WorkerInactive");
    });

    it("company admin can reactivate a worker", async function () {
      await payroll.connect(companyAdmin).setWorkerStatus(worker2.address, true);
      expect(await payroll.isActiveWorker(worker2.address)).to.be.true;
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // 8. AUDITOR ACCESS CONTROL
  // ══════════════════════════════════════════════════════════════════

  describe("8. Auditor Access Control", function () {
    it("auditor has no access by default", async function () {
      expect(await payroll.hasAuditorAccess(auditor.address)).to.be.false;
    });

    it("unauthorized user cannot grant auditor access", async function () {
      await expect(
        payroll.connect(unauthorized).grantAuditorAccess(auditor.address)
      ).to.be.revertedWithCustomError(payroll, "NotCompanyAdmin");
    });

    it("company admin can grant auditor access", async function () {
      const tx = await payroll
        .connect(companyAdmin)
        .grantAuditorAccess(auditor.address);
      await expect(tx).to.emit(payroll, "AuditorAccessGranted");
      expect(await payroll.hasAuditorAccess(auditor.address)).to.be.true;
    });

    it("company admin can revoke auditor access", async function () {
      await payroll.connect(companyAdmin).revokeAuditorAccess(auditor.address);
      expect(await payroll.hasAuditorAccess(auditor.address)).to.be.false;
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // 9. EMERGENCY CONTROLS
  // ══════════════════════════════════════════════════════════════════

  describe("9. Emergency Controls", function () {
    it("company admin can pause payroll", async function () {
      await payroll.connect(companyAdmin).pause();
      expect(await payroll.paused()).to.be.true;
    });

    it("worker cannot claim when paused", async function () {
      await expect(
        payroll.connect(worker1).claimSalary()
      ).to.be.reverted;
    });

    it("cannot add worker when paused", async function () {
      const encSalary = await mockEncryptSalary(BigInt(1000));
      await expect(
        payroll.connect(companyAdmin).addWorker(
          auditor.address,
          ethers.keccak256(ethers.toUtf8Bytes("EMP-AUD")),
          encSalary
        )
      ).to.be.reverted;
    });

    it("company admin can unpause payroll", async function () {
      await payroll.connect(companyAdmin).unpause();
      expect(await payroll.paused()).to.be.false;
    });

    it("admin can emergency withdraw from vault", async function () {
      const balBefore = await mockUSDC.balanceOf(companyAdmin.address);
      const vaultBal = await vault.getBalance();
      if (vaultBal > 0) {
        await vault.connect(companyAdmin).emergencyWithdraw(vaultBal);
        const balAfter = await mockUSDC.balanceOf(companyAdmin.address);
        expect(balAfter).to.be.greaterThan(balBefore);
      }
    });

    it("non-admin cannot emergency withdraw", async function () {
      await expect(
        vault.connect(unauthorized).emergencyWithdraw(1000)
      ).to.be.revertedWith("Vault: not admin");
    });
  });
});
