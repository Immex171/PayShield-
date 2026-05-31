// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { PayShieldPayroll } from "./PayShieldPayroll.sol";
import { PayShieldVault } from "./PayShieldVault.sol";
import { PayShieldAccessManager } from "./PayShieldAccessManager.sol";
import { PayrollEvents } from "./libraries/PayrollEvents.sol";
import { PayrollErrors } from "./libraries/PayrollErrors.sol";

/// @title PayShieldFactory
/// @notice Deploys and tracks company payroll contracts.
///
/// Deployment flow:
///   1. Company calls createPayroll(token) with approved ERC-20 token address
///   2. Factory deploys PayShieldVault + PayShieldPayroll atomically
///   3. Factory initializes payroll with vault + access manager addresses
///   4. Factory links vault to payroll (setAuthorizedPayroll)
///   5. Factory registers company admin in AccessManager
///   6. Emits PayrollCreated event
///
/// One company = one payroll contract (for MVP simplicity).
/// The constraint can be relaxed in V2 for multi-department payrolls.
contract PayShieldFactory is Ownable {
    // ─── State ────────────────────────────────────────────────────────
    PayShieldAccessManager public immutable accessManager;

    /// @dev company admin address => payroll contract address
    mapping(address => address) public companyPayroll;

    /// @dev payroll address => vault address
    mapping(address => address) public payrollVault;

    /// @dev All deployed payroll contracts
    address[] public allPayrolls;

    // ─── Constructor ─────────────────────────────────────────────────

    constructor(address accessManager_) Ownable(msg.sender) {
        require(accessManager_ != address(0), "Factory: invalid access manager");
        accessManager = PayShieldAccessManager(accessManager_);
    }

    // ─── Core: Create Payroll ─────────────────────────────────────────

    /// @notice Deploy a new payroll + vault for the calling company admin
    /// @param token ERC-20 token address to use for salary payments (e.g. MockUSDC)
    /// @return payrollAddress The address of the deployed PayShieldPayroll contract
    /// @return vaultAddress The address of the deployed PayShieldVault contract
    function createPayroll(address token)
        external
        returns (address payrollAddress, address vaultAddress)
    {
        if (token == address(0)) revert PayrollErrors.InvalidWorkerAddress();
        if (companyPayroll[msg.sender] != address(0)) {
            revert PayrollErrors.PayrollAlreadyExists(msg.sender);
        }

        address companyAdmin = msg.sender;

        // 1. Deploy vault
        PayShieldVault vault = new PayShieldVault(token, companyAdmin, address(this));
        vaultAddress = address(vault);

        // 2. Deploy payroll
        PayShieldPayroll payroll = new PayShieldPayroll(companyAdmin, address(this));
        payrollAddress = address(payroll);

        // 3. Initialize payroll with vault + access manager
        payroll.initialize(vaultAddress, address(accessManager));

        // 4. Link vault to payroll (only the payroll can call releaseSalary)
        vault.setAuthorizedPayroll(payrollAddress);

        // 5. Register company admin in access manager
        accessManager.initializePayrollAdmin(payrollAddress, companyAdmin);

        // 6. Record deployment
        companyPayroll[companyAdmin] = payrollAddress;
        payrollVault[payrollAddress] = vaultAddress;
        allPayrolls.push(payrollAddress);

        emit PayrollEvents.PayrollCreated(
            companyAdmin,
            payrollAddress,
            vaultAddress,
            block.timestamp
        );

        return (payrollAddress, vaultAddress);
    }

    // ─── View ─────────────────────────────────────────────────────────

    /// @notice Get the payroll address for a company admin
    function getPayroll(address company) external view returns (address) {
        return companyPayroll[company];
    }

    /// @notice Get the vault address for a payroll
    function getVault(address payroll) external view returns (address) {
        return payrollVault[payroll];
    }

    /// @notice Total number of deployed payrolls
    function totalPayrolls() external view returns (uint256) {
        return allPayrolls.length;
    }

    /// @notice Get all deployed payroll addresses (for indexers/UI)
    function getAllPayrolls() external view returns (address[] memory) {
        return allPayrolls;
    }

    /// @notice Check if an address has a deployed payroll
    function hasPayroll(address company) external view returns (bool) {
        return companyPayroll[company] != address(0);
    }
}
