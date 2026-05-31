// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { PayrollErrors } from "./libraries/PayrollErrors.sol";
import { PayrollEvents } from "./libraries/PayrollEvents.sol";

/// @title PayShieldAccessManager
/// @notice Manages role-based access control for PayShield payroll contracts.
///
/// Roles:
///   COMPANY_ADMIN — Created by factory; owns and administers a payroll contract.
///   WORKER        — Registered per-payroll; can only decrypt their own salary.
///   AUDITOR       — Granted per-payroll by company admin; can view proof summaries.
///
/// @dev This is a standalone contract so access logic stays separate from business logic.
///      Each PayShieldPayroll instance calls into this contract for permission checks,
///      but access state is also mirrored in the payroll contract for gas efficiency.
contract PayShieldAccessManager is Ownable {
    // ─── Role Constants ───────────────────────────────────────────────
    bytes32 public constant COMPANY_ADMIN_ROLE = keccak256("COMPANY_ADMIN");
    bytes32 public constant WORKER_ROLE = keccak256("WORKER");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR");

    // ─── State ────────────────────────────────────────────────────────
    // payroll => role => address => granted
    mapping(address => mapping(bytes32 => mapping(address => bool))) private _roles;
    // payroll => address[] for enumeration
    mapping(address => address[]) private _payrollAuditors;
    mapping(address => address[]) private _payrollWorkers;

    // ─── Events ───────────────────────────────────────────────────────
    event RoleGranted(
        address indexed payroll,
        bytes32 indexed role,
        address indexed account,
        address grantedBy
    );
    event RoleRevoked(
        address indexed payroll,
        bytes32 indexed role,
        address indexed account,
        address revokedBy
    );

    constructor() Ownable(msg.sender) {}

    // ─── Grant / Revoke ───────────────────────────────────────────────

    /// @notice Grant a role on a specific payroll contract
    /// @dev Caller must already hold COMPANY_ADMIN_ROLE on that payroll (or be factory/owner)
    function grantRole(
        address payroll,
        bytes32 role,
        address account
    ) external {
        // Only company admin of that payroll or owner can grant
        require(
            _roles[payroll][COMPANY_ADMIN_ROLE][msg.sender] || msg.sender == owner(),
            "AccessManager: not authorized"
        );
        _grantRole(payroll, role, account, msg.sender);
    }

    /// @notice Revoke a role on a specific payroll contract
    function revokeRole(
        address payroll,
        bytes32 role,
        address account
    ) external {
        require(
            _roles[payroll][COMPANY_ADMIN_ROLE][msg.sender] || msg.sender == owner(),
            "AccessManager: not authorized"
        );
        _revokeRole(payroll, role, account, msg.sender);
    }

    /// @notice Internal: called by factory when payroll is created to set initial admin
    function initializePayrollAdmin(address payroll, address admin) external onlyOwner {
        _grantRole(payroll, COMPANY_ADMIN_ROLE, admin, msg.sender);
    }

    /// @notice Called by payroll contract to register a worker
    function registerWorker(address payroll, address worker) external {
        require(
            _roles[payroll][COMPANY_ADMIN_ROLE][msg.sender] || msg.sender == payroll,
            "AccessManager: not payroll admin"
        );
        _grantRole(payroll, WORKER_ROLE, worker, msg.sender);
        _payrollWorkers[payroll].push(worker);
    }

    /// @notice Called by payroll contract to grant auditor access
    function grantAuditorAccess(address payroll, address auditor) external {
        require(
            _roles[payroll][COMPANY_ADMIN_ROLE][msg.sender] || msg.sender == payroll,
            "AccessManager: not payroll admin"
        );
        _grantRole(payroll, AUDITOR_ROLE, auditor, msg.sender);
        _payrollAuditors[payroll].push(auditor);
        emit PayrollEvents.AuditorAccessGranted(payroll, auditor, msg.sender, block.timestamp);
    }

    /// @notice Called by payroll contract to revoke auditor access
    function revokeAuditorAccess(address payroll, address auditor) external {
        require(
            _roles[payroll][COMPANY_ADMIN_ROLE][msg.sender] || msg.sender == payroll,
            "AccessManager: not payroll admin"
        );
        _revokeRole(payroll, AUDITOR_ROLE, auditor, msg.sender);
        emit PayrollEvents.AuditorAccessRevoked(payroll, auditor, block.timestamp);
    }

    // ─── View ─────────────────────────────────────────────────────────

    function hasRole(
        address payroll,
        bytes32 role,
        address account
    ) external view returns (bool) {
        return _roles[payroll][role][account];
    }

    function isCompanyAdmin(address payroll, address account) external view returns (bool) {
        return _roles[payroll][COMPANY_ADMIN_ROLE][account];
    }

    function isWorker(address payroll, address account) external view returns (bool) {
        return _roles[payroll][WORKER_ROLE][account];
    }

    function isAuditor(address payroll, address account) external view returns (bool) {
        return _roles[payroll][AUDITOR_ROLE][account];
    }

    function getPayrollAuditors(address payroll) external view returns (address[] memory) {
        return _payrollAuditors[payroll];
    }

    function getPayrollWorkers(address payroll) external view returns (address[] memory) {
        return _payrollWorkers[payroll];
    }

    // ─── Internal ─────────────────────────────────────────────────────

    function _grantRole(
        address payroll,
        bytes32 role,
        address account,
        address grantedBy
    ) internal {
        if (!_roles[payroll][role][account]) {
            _roles[payroll][role][account] = true;
            emit RoleGranted(payroll, role, account, grantedBy);
        }
    }

    function _revokeRole(
        address payroll,
        bytes32 role,
        address account,
        address revokedBy
    ) internal {
        if (_roles[payroll][role][account]) {
            _roles[payroll][role][account] = false;
            emit RoleRevoked(payroll, role, account, revokedBy);
        }
    }
}
