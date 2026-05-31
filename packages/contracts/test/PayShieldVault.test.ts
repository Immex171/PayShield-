import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { PayShieldVault, MockUSDC } from "../typechain-types";

describe("PayShieldVault — Unit Tests", function () {
  let companyAdmin: SignerWithAddress;
  let authorizedPayroll: SignerWithAddress; // simulates payroll contract
  let unauthorized: SignerWithAddress;
  let worker: SignerWithAddress;
  let vault: PayShieldVault;
  let mockUSDC: MockUSDC;

  const DEPOSIT_AMOUNT = BigInt(100_000 * 1e6);

  before(async function () {
    [companyAdmin, authorizedPayroll, unauthorized, worker] =
      await ethers.getSigners();

    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDCFactory.deploy();
    await mockUSDC.waitForDeployment();
    await mockUSDC.mint(companyAdmin.address, BigInt(1_000_000 * 1e6));

    const VaultFactory = await ethers.getContractFactory("PayShieldVault");
    vault = await VaultFactory.deploy(
      await mockUSDC.getAddress(),
      companyAdmin.address
    ) as unknown as PayShieldVault;
    await vault.waitForDeployment();

    // Use authorizedPayroll.address to simulate the payroll contract
    await vault
      .connect(companyAdmin)
      .setAuthorizedPayroll(authorizedPayroll.address);
  });

  it("initial vault balance is zero", async function () {
    expect(await vault.getBalance()).to.equal(0);
  });

  it("allows deposit and records balance", async function () {
    await mockUSDC
      .connect(companyAdmin)
      .approve(await vault.getAddress(), DEPOSIT_AMOUNT);
    await vault.connect(companyAdmin).deposit(DEPOSIT_AMOUNT);
    expect(await vault.getBalance()).to.equal(DEPOSIT_AMOUNT);
  });

  it("only authorized payroll can call releaseSalary", async function () {
    const releaseAmount = BigInt(1_000 * 1e6);
    await expect(
      vault.connect(unauthorized).releaseSalary(worker.address, releaseAmount)
    ).to.be.revertedWith("Vault: caller not authorized payroll");
  });

  it("authorized payroll can release salary", async function () {
    const releaseAmount = BigInt(1_000 * 1e6);
    const workerBalBefore = await mockUSDC.balanceOf(worker.address);
    await vault
      .connect(authorizedPayroll)
      .releaseSalary(worker.address, releaseAmount);
    const workerBalAfter = await mockUSDC.balanceOf(worker.address);
    expect(workerBalAfter - workerBalBefore).to.equal(releaseAmount);
  });

  it("reverts if vault is underfunded on release", async function () {
    const tooMuch = BigInt(999_999_999 * 1e6);
    await expect(
      vault
        .connect(authorizedPayroll)
        .releaseSalary(worker.address, tooMuch)
    ).to.be.revertedWithCustomError(vault, "InsufficientVaultBalance");
  });

  it("setAuthorizedPayroll cannot be called twice", async function () {
    await expect(
      vault.connect(companyAdmin).setAuthorizedPayroll(unauthorized.address)
    ).to.be.revertedWith("Vault: payroll already set");
  });

  it("returns correct token address", async function () {
    expect(await vault.token()).to.equal(await mockUSDC.getAddress());
  });
});
