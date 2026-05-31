// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title PayrollErrors
/// @notice Custom errors for gas-efficient revert messages
library PayrollErrors {
    // ─── Access Control ───────────────────────────────────────────────
    error NotCompanyAdmin(address caller);
    error NotWorker(address caller);
    error NotAuditor(address caller);
    error NotAuthorized(address caller, string reason);
    error AuditorAccessNotGranted(address auditor, address payroll);

    // ─── Worker Management ────────────────────────────────────────────
    error WorkerAlreadyRegistered(address worker);
    error WorkerNotRegistered(address worker);
    error WorkerInactive(address worker);
    error WorkerSuspended(address worker);
    error InvalidWorkerAddress();

    // ─── Payroll / Vault ──────────────────────────────────────────────
    error InsufficientVaultBalance(uint256 required, uint256 available);
    error PayrollPaused();
    error PayrollAlreadyExists(address company);
    error PayrollNotFound(address company);
    error AlreadyClaimed(address worker, uint256 periodId);
    error InvalidPayPeriod();

    // ─── Encryption / FHE ─────────────────────────────────────────────
    error InvalidEncryptedInput();
    error DecryptionNotReady();
    error SalaryDecryptionNotPermitted(address requester);

    // ─── Token ────────────────────────────────────────────────────────
    error TransferFailed(address token, address to, uint256 amount);
    error InsufficientAllowance(address spender, uint256 required, uint256 available);
    error ZeroAmount();
}
