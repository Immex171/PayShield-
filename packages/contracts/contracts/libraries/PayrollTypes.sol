// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title PayrollTypes
/// @notice Shared type definitions for PayShield contracts
library PayrollTypes {
    /// @notice Status of a worker's registration in the payroll
    enum WorkerStatus {
        Inactive, // 0 — not registered or removed
        Active, // 1 — registered and eligible to claim
        Suspended // 2 — temporarily suspended by admin
    }

    /// @notice A single payroll period record
    struct PayPeriod {
        uint256 periodId;
        uint256 startTime;
        uint256 endTime;
        bool distributed;
    }

    /// @notice Metadata stored alongside an encrypted salary record
    /// Salary amount is stored separately as euint128 in the main contract
    struct WorkerRecord {
        address workerAddress;
        bytes32 employeeIdHash; // keccak256 of off-chain employee ID — never plaintext
        WorkerStatus status;
        uint256 registeredAt;
        uint256 lastClaimedAt;
        uint256 claimCount;
    }

    /// @notice Payroll configuration set by company admin
    struct PayrollConfig {
        address vaultAddress;
        address accessManagerAddress;
        uint256 payPeriodDuration; // seconds
        bool isPaused;
        uint256 createdAt;
    }
}
