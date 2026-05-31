// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { PayrollTypes } from "../libraries/PayrollTypes.sol";

/// @title IPayShieldPayroll
/// @notice Interface for the PayShield payroll contract with Fhenix CoFHE encrypted salaries
interface IPayShieldPayroll {
    // ─── Worker Management ────────────────────────────────────────────

    /// @notice Register a worker and set their encrypted salary
    /// @param worker Address of the worker wallet
    /// @param employeeIdHash keccak256 hash of the off-chain employee ID
    /// @param encryptedSalary The CoFHE encrypted salary amount (euint128 serialized)
    function addWorker(
        address worker,
        bytes32 employeeIdHash,
        bytes calldata encryptedSalary
    ) external;

    /// @notice Update a registered worker's encrypted salary
    /// @param worker Address of the worker
    /// @param newEncryptedSalary Updated CoFHE encrypted salary
    function updateWorkerSalary(
        address worker,
        bytes calldata newEncryptedSalary
    ) external;

    /// @notice Set a worker's active/inactive status
    /// @param worker Address of the worker
    /// @param active True to activate, false to deactivate
    function setWorkerStatus(address worker, bool active) external;

    // ─── Claim Flow ───────────────────────────────────────────────────

    /// @notice Allow a worker to claim their salary for the current period
    function claimSalary() external;

    // ─── View / Decrypt ───────────────────────────────────────────────

    /// @notice Get worker record metadata (no salary amount)
    /// @param worker Address of the worker
    function getWorkerRecord(address worker)
        external
        view
        returns (PayrollTypes.WorkerRecord memory);

    /// @notice Check if a worker is registered and active
    /// @param worker Address to check
    function isActiveWorker(address worker) external view returns (bool);

    /// @notice Get the company admin address
    function companyAdmin() external view returns (address);

    // ─── Access Control ───────────────────────────────────────────────

    /// @notice Grant an auditor permission to view salary data
    /// @param auditor Address of the auditor
    function grantAuditorAccess(address auditor) external;

    /// @notice Revoke auditor access
    /// @param auditor Address to revoke
    function revokeAuditorAccess(address auditor) external;

    /// @notice Check if an address has auditor access
    function hasAuditorAccess(address auditor) external view returns (bool);
}
