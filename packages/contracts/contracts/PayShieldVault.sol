// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IPayShieldVault } from "./interfaces/IPayShieldVault.sol";
import { PayrollErrors } from "./libraries/PayrollErrors.sol";
import { PayrollEvents } from "./libraries/PayrollEvents.sol";

/// @title PayShieldVault
/// @notice Holds payroll funds for a single company payroll contract.
///
/// Design decisions:
/// - One vault per payroll contract (1:1 relationship)
/// - Only the authorized PayShieldPayroll contract can call releaseSalary()
/// - Company admin can deposit and emergency withdraw
/// - Token is set at construction; swap requires new vault (audit trail clarity)
/// - Interface accepts IConfidentialToken for future encrypted payment integration
///
/// @dev For MVP, this uses standard ERC-20 (MockUSDC).
///      Future integration path: swap token_ for an IConfidentialToken and use
///      confidentialTransfer() in releaseSalary().
contract PayShieldVault is IPayShieldVault, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── State ────────────────────────────────────────────────────────
    IERC20 private immutable _token;
    address private immutable _companyAdmin;
    address private immutable _factory;
    address private _authorizedPayroll; // set once by factory
    bool private _payrollSet;

    // ─── Events ───────────────────────────────────────────────────────
    event PayrollAuthorized(address indexed payroll);
    event EmergencyWithdrawal(address indexed admin, uint256 amount, uint256 timestamp);
    event SalaryReleased(address indexed worker, uint256 amount, uint256 timestamp);

    // ─── Constructor ─────────────────────────────────────────────────
    constructor(address token_, address companyAdmin_, address factory_) {
        if (token_ == address(0)) revert PayrollErrors.InvalidWorkerAddress();
        if (companyAdmin_ == address(0)) revert PayrollErrors.InvalidWorkerAddress();
        if (factory_ == address(0)) revert PayrollErrors.InvalidWorkerAddress();
        _token = IERC20(token_);
        _companyAdmin = companyAdmin_;
        _factory = factory_;
    }

    // ─── Setup ────────────────────────────────────────────────────────

    /// @notice Called by factory once to link the payroll contract
    function setAuthorizedPayroll(address payroll_) external {
        require(!_payrollSet, "Vault: payroll already set");
        require(payroll_ != address(0), "Vault: invalid payroll address");
        require(
            msg.sender == _companyAdmin || msg.sender == _factory,
            "Vault: only admin or factory can set payroll"
        );
        _authorizedPayroll = payroll_;
        _payrollSet = true;
        emit PayrollAuthorized(payroll_);
    }

    // ─── IPayShieldVault Implementation ──────────────────────────────

    /// @notice Deposit tokens into the vault
    /// @dev Anyone can top up the vault (company, DAO treasury, etc.)
    function deposit(uint256 amount) external override nonReentrant {
        if (amount == 0) revert PayrollErrors.ZeroAmount();
        _token.safeTransferFrom(msg.sender, address(this), amount);
        emit PayrollEvents.VaultFunded(
            _authorizedPayroll,
            address(this),
            msg.sender,
            amount,
            block.timestamp
        );
    }

    /// @notice Release salary to a worker
    /// @dev Only callable by the authorized payroll contract
    function releaseSalary(address worker, uint256 amount) external override nonReentrant {
        require(msg.sender == _authorizedPayroll, "Vault: caller not authorized payroll");
        if (amount == 0) revert PayrollErrors.ZeroAmount();

        uint256 balance = _token.balanceOf(address(this));
        if (balance < amount) {
            revert PayrollErrors.InsufficientVaultBalance(amount, balance);
        }

        _token.safeTransfer(worker, amount);
        emit SalaryReleased(worker, amount, block.timestamp);
    }

    /// @notice Emergency withdrawal by company admin
    function emergencyWithdraw(uint256 amount) external override nonReentrant {
        require(msg.sender == _companyAdmin, "Vault: not admin");
        if (amount == 0) revert PayrollErrors.ZeroAmount();

        uint256 balance = _token.balanceOf(address(this));
        if (balance < amount) {
            revert PayrollErrors.InsufficientVaultBalance(amount, balance);
        }

        _token.safeTransfer(_companyAdmin, amount);
        emit EmergencyWithdrawal(_companyAdmin, amount, block.timestamp);
    }

    // ─── View ─────────────────────────────────────────────────────────

    function getBalance() external view override returns (uint256) {
        return _token.balanceOf(address(this));
    }

    function token() external view override returns (address) {
        return address(_token);
    }

    function authorizedPayroll() external view override returns (address) {
        return _authorizedPayroll;
    }

    function companyAdmin() external view returns (address) {
        return _companyAdmin;
    }
}
