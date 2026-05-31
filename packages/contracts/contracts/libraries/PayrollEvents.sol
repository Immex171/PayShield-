// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title PayrollEvents
/// @notice Events emitted by PayShield contracts
/// @dev Salary amounts are intentionally NEVER included in events to prevent on-chain leakage
library PayrollEvents {
    // ─── Factory ──────────────────────────────────────────────────────
    /// @notice Emitted when a new company payroll contract is deployed
    /// @param company The address of the company admin
    /// @param payroll The address of the newly deployed PayShieldPayroll contract
    /// @param vault   The address of the associated PayShieldVault
    event PayrollCreated(
        address indexed company,
        address indexed payroll,
        address indexed vault,
        uint256 timestamp
    );

    // ─── Worker Management ────────────────────────────────────────────
    /// @notice Emitted when a worker is registered
    /// employeeIdHash is a keccak256 hash — plaintext ID is never stored on-chain
    event WorkerRegistered(
        address indexed payroll,
        address indexed worker,
        bytes32 indexed employeeIdHash,
        uint256 timestamp
    );

    /// @notice Emitted when a worker's status changes
    event WorkerStatusChanged(
        address indexed payroll,
        address indexed worker,
        uint8 newStatus,
        uint256 timestamp
    );

    /// @notice Emitted when a worker's encrypted salary is updated
    /// NOTE: The new salary amount is deliberately omitted from this event
    event SalaryUpdated(
        address indexed payroll,
        address indexed worker,
        uint256 timestamp
    );

    // ─── Payroll Operations ───────────────────────────────────────────
    /// @notice Emitted when a worker successfully claims their salary
    /// Amount intentionally omitted to protect privacy
    event SalaryClaimed(
        address indexed payroll,
        address indexed worker,
        uint256 indexed periodId,
        uint256 timestamp
    );

    /// @notice Emitted when payroll is funded
    event VaultFunded(
        address indexed payroll,
        address indexed vault,
        address indexed funder,
        uint256 amount,
        uint256 timestamp
    );

    // ─── Access Control ───────────────────────────────────────────────
    /// @notice Emitted when auditor access is granted
    event AuditorAccessGranted(
        address indexed payroll,
        address indexed auditor,
        address indexed grantedBy,
        uint256 timestamp
    );

    /// @notice Emitted when auditor access is revoked
    event AuditorAccessRevoked(
        address indexed payroll,
        address indexed auditor,
        uint256 timestamp
    );

    // ─── Admin ────────────────────────────────────────────────────────
    /// @notice Emitted when payroll is paused or unpaused
    event PayrollPauseToggled(
        address indexed payroll,
        bool isPaused,
        uint256 timestamp
    );
}
