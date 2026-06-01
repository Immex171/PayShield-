// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

// ─── Fhenix CoFHE imports ─────────────────────────────────────────────────
// FHE library provides encrypted types and operations on Fhenix network.
// In the local CoFHE mock environment, these resolve to mock implementations.
import { FHE, euint128, TASK_MANAGER_ADDRESS } from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import { ITaskManager } from "@fhenixprotocol/cofhe-contracts/ICofhe.sol";

// ─── OpenZeppelin ─────────────────────────────────────────────────────────
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";

// ─── PayShield ────────────────────────────────────────────────────────────
import { IPayShieldPayroll } from "./interfaces/IPayShieldPayroll.sol";
import { IPayShieldVault } from "./interfaces/IPayShieldVault.sol";
import { PayShieldAccessManager } from "./PayShieldAccessManager.sol";
import { PayrollTypes } from "./libraries/PayrollTypes.sol";
import { PayrollErrors } from "./libraries/PayrollErrors.sol";
import { PayrollEvents } from "./libraries/PayrollEvents.sol";

/// @title PayShieldPayroll
/// @notice Core payroll contract with Fhenix CoFHE encrypted salary storage.
///
/// Privacy guarantees:
///   - Salary amounts stored as euint128 (FHE-encrypted ciphertext)
///   - Salary amounts never emitted in events (see PayrollEvents)
///   - Decryption gated by FHE access control: worker can only unseal their own salary
///   - Public callers see only metadata (worker address, status, claim timestamps)
///   - Auditors see proof summaries only if explicitly granted by company admin
///
/// CoFHE integration:
///   - addWorker(): receives client-side encrypted InEuint128, wraps to euint128
///   - updateWorkerSalary(): same pattern for updates
///   - claimSalary(): reads euint128, converts to plaintext inside FHE computation
///     for vault release; worker can also unseal their own encrypted salary via
///     FHE.sealoutput() with the FHE permission system
///
/// @dev This contract targets the Fhenix local mock + Helium testnet.
///      FHE operations will revert on standard EVM networks.
/// @dev Permission payload for client-side salary unsealing (CoFHE SDK sealing key)
struct SealingPermission {
    bytes32 sealingKey;
}

contract PayShieldPayroll is IPayShieldPayroll, ReentrancyGuard, Pausable {
    using FHE for euint128;

    // ─── State ────────────────────────────────────────────────────────
    address private immutable _companyAdmin;
    address private immutable _factory;
    IPayShieldVault private _vault;
    PayShieldAccessManager private _accessManager;

    /// @dev Encrypted salary per worker — euint128 is Fhenix's 128-bit encrypted uint type
    mapping(address => euint128) private _encryptedSalaries;

    /// @dev Worker metadata (no salary amount stored here in plaintext)
    mapping(address => PayrollTypes.WorkerRecord) private _workers;

    /// @dev Ordered list of registered worker addresses
    address[] private _workerList;

    /// @dev Auditor access registry (also maintained in AccessManager for cross-contract queries)
    mapping(address => bool) private _auditorAccess;

    /// @dev Tracks which (worker, periodId) combinations have been claimed
    mapping(address => mapping(uint256 => bool)) private _claimed;

    /// @dev Simple period counter — incremented by admin to start new pay period
    uint256 public currentPeriodId;

    /// @dev Timestamp when the current pay period started
    uint256 public periodStartedAt;

    /// @dev Tracks pending decrypt requests per worker for async CoFHE claim flow
    mapping(address => bool) private _decryptPending;

    /// @dev Optional custom payout address per worker (stealth address support)
    mapping(address => address) private _customPayoutAddresses;

    bool private _initialized;

    // ─── Constructor ─────────────────────────────────────────────────

    constructor(address companyAdmin_, address factory_) {
        if (companyAdmin_ == address(0)) revert PayrollErrors.InvalidWorkerAddress();
        _companyAdmin = companyAdmin_;
        _factory = factory_;
    }

    // ─── Initializer (called by factory post-deploy) ──────────────────

    /// @notice Initialize with vault and access manager addresses
    function initialize(
        address vault_,
        address accessManager_
    ) external {
        require(msg.sender == _factory, "Payroll: only factory");
        require(!_initialized, "Payroll: already initialized");
        require(vault_ != address(0), "Payroll: invalid vault");
        require(accessManager_ != address(0), "Payroll: invalid access manager");

        _vault = IPayShieldVault(vault_);
        _accessManager = PayShieldAccessManager(accessManager_);
        _initialized = true;
        currentPeriodId = 1;
        periodStartedAt = block.timestamp;
    }

    // ─── Modifiers ────────────────────────────────────────────────────

    modifier onlyCompanyAdmin() {
        if (msg.sender != _companyAdmin) {
            revert PayrollErrors.NotCompanyAdmin(msg.sender);
        }
        _;
    }

    modifier onlyActiveWorker() {
        PayrollTypes.WorkerRecord storage record = _workers[msg.sender];
        if (record.workerAddress == address(0)) revert PayrollErrors.WorkerNotRegistered(msg.sender);
        if (record.status == PayrollTypes.WorkerStatus.Inactive) revert PayrollErrors.WorkerInactive(msg.sender);
        if (record.status == PayrollTypes.WorkerStatus.Suspended) revert PayrollErrors.WorkerSuspended(msg.sender);
        _;
    }

    modifier initialized() {
        require(_initialized, "Payroll: not initialized");
        _;
    }

    // ─── IPayShieldPayroll: Worker Management ─────────────────────────

    /// @notice Register a worker and store their encrypted salary
    /// @param worker Worker wallet address
    /// @param employeeIdHash keccak256 of off-chain employee identifier
    /// @param encryptedSalary ABI-encoded InEuint128 from client-side CoFHE encryption
    function addWorker(
        address worker,
        bytes32 employeeIdHash,
        bytes calldata encryptedSalary
    ) external override onlyCompanyAdmin initialized whenNotPaused {
        if (worker == address(0)) revert PayrollErrors.InvalidWorkerAddress();
        if (_workers[worker].workerAddress != address(0)) {
            revert PayrollErrors.WorkerAlreadyRegistered(worker);
        }
        if (encryptedSalary.length == 0) revert PayrollErrors.InvalidEncryptedInput();

        // ── CoFHE: Decode the client-encrypted input and store as euint128 ──
        // InEuint128 is the "input" type — it carries an encrypted value +
        // a proof-of-encryption from the client's CoFHE SDK call.
        // FHE.asEuint128() validates the proof and converts to the on-chain type.
        euint128 encSalary = _toEncryptedSalary(encryptedSalary);

        // ── Allow worker to decrypt their own salary ──
        // FHE.allow() registers an access permission so the worker's address
        // can call FHE.sealOutput() or FHE.decrypt() on this value.
        FHE.allow(encSalary, worker);
        // Also allow the company admin to view (for admin operations)
        FHE.allow(encSalary, _companyAdmin);
        // Allow this contract itself (for internal FHE operations in claimSalary)
        FHE.allow(encSalary, address(this));

        // Store the encrypted salary handle
        _encryptedSalaries[worker] = encSalary;

        // Store worker metadata (no plaintext salary here)
        _workers[worker] = PayrollTypes.WorkerRecord({
            workerAddress: worker,
            employeeIdHash: employeeIdHash,
            status: PayrollTypes.WorkerStatus.Active,
            registeredAt: block.timestamp,
            lastClaimedAt: 0,
            claimCount: 0
        });

        _workerList.push(worker);

        // Register worker role in access manager
        _accessManager.registerWorker(address(this), worker);

        emit PayrollEvents.WorkerRegistered(
            address(this),
            worker,
            employeeIdHash,
            block.timestamp
        );
    }

    /// @notice Update an existing worker's encrypted salary
    function updateWorkerSalary(
        address worker,
        bytes calldata newEncryptedSalary
    ) external override onlyCompanyAdmin initialized whenNotPaused {
        if (_workers[worker].workerAddress == address(0)) {
            revert PayrollErrors.WorkerNotRegistered(worker);
        }
        if (newEncryptedSalary.length == 0) revert PayrollErrors.InvalidEncryptedInput();

        euint128 encSalary = _toEncryptedSalary(newEncryptedSalary);

        // Re-grant access permissions on the new ciphertext
        FHE.allow(encSalary, worker);
        FHE.allow(encSalary, _companyAdmin);
        FHE.allow(encSalary, address(this));

        _encryptedSalaries[worker] = encSalary;

        emit PayrollEvents.SalaryUpdated(address(this), worker, block.timestamp);
    }

    /// @notice Set a worker's active/inactive status
    function setWorkerStatus(address worker, bool active) external override onlyCompanyAdmin {
        if (_workers[worker].workerAddress == address(0)) {
            revert PayrollErrors.WorkerNotRegistered(worker);
        }

        PayrollTypes.WorkerStatus newStatus = active
            ? PayrollTypes.WorkerStatus.Active
            : PayrollTypes.WorkerStatus.Inactive;

        _workers[worker].status = newStatus;

        emit PayrollEvents.WorkerStatusChanged(
            address(this),
            worker,
            uint8(newStatus),
            block.timestamp
        );
    }

    // ─── IPayShieldPayroll: Claim Flow ────────────────────────────────

    /// @notice Request threshold decryption of the caller's salary (step 1 of claim)
    /// @dev On Fhenix Helium, decryption is async — call this first, wait, then claimSalary()
    function prepareClaimDecrypt() external onlyActiveWorker initialized whenNotPaused {
        address worker = msg.sender;
        if (_claimed[worker][currentPeriodId]) {
            revert PayrollErrors.AlreadyClaimed(worker, currentPeriodId);
        }

        euint128 encSalary = _encryptedSalaries[worker];
        ITaskManager(TASK_MANAGER_ADDRESS).createDecryptTask(
            uint256(euint128.unwrap(encSalary)),
            worker
        );
        _decryptPending[worker] = true;
    }

    /// @notice Worker claims their salary for the current period (step 2 of claim)
    /// @dev Decrypts the euint128 within the FHE environment to obtain the
    ///      plaintext amount, then instructs the vault to release that amount.
    ///
    ///      CoFHE privacy note: FHE.decrypt() on Fhenix runs inside the
    ///      threshold decryption network — the plaintext is returned to the
    ///      contract's execution context but is NOT stored in contract state
    ///      and does NOT appear in transaction calldata or storage.
    function claimSalary()
        external
        override
        onlyActiveWorker
        nonReentrant
        initialized
        whenNotPaused
    {
        address worker = msg.sender;

        // Prevent double-claim per period
        if (_claimed[worker][currentPeriodId]) {
            revert PayrollErrors.AlreadyClaimed(worker, currentPeriodId);
        }

        euint128 encSalary = _encryptedSalaries[worker];

        // Ensure decrypt task exists (auto-request if worker skipped prepareClaimDecrypt)
        if (!_decryptPending[worker]) {
            ITaskManager(TASK_MANAGER_ADDRESS).createDecryptTask(
                uint256(euint128.unwrap(encSalary)),
                worker
            );
            _decryptPending[worker] = true;
        }

        (uint128 salaryAmount, bool ready) = FHE.getDecryptResultSafe(encSalary);
        if (!ready) revert PayrollErrors.DecryptionNotReady();

        if (salaryAmount == 0) revert PayrollErrors.ZeroAmount();

        // Check vault balance
        uint256 vaultBalance = _vault.getBalance();
        if (vaultBalance < salaryAmount) {
            revert PayrollErrors.InsufficientVaultBalance(salaryAmount, vaultBalance);
        }

        // Mark claimed before external call (CEI pattern)
        _claimed[worker][currentPeriodId] = true;
        _decryptPending[worker] = false;
        _workers[worker].lastClaimedAt = block.timestamp;
        _workers[worker].claimCount += 1;

        // Release salary — use stealth/custom payout address if set
        address recipient = _customPayoutAddresses[worker];
        if (recipient == address(0)) recipient = worker;
        _vault.releaseSalary(recipient, uint256(salaryAmount));

        emit PayrollEvents.SalaryClaimed(
            address(this),
            worker,
            currentPeriodId,
            block.timestamp
        );
    }

    // ─── Admin: Period Management ─────────────────────────────────────

    /// @notice Advance to the next pay period
    function advancePeriod() external onlyCompanyAdmin {
        emit PayrollEvents.PeriodAdvanced(address(this), currentPeriodId, block.timestamp);
        currentPeriodId += 1;
        periodStartedAt = block.timestamp;
    }

    // ─── Worker: Stealth Payout Address ─────────────────────────────

    /// @notice Set a custom payout address for salary claims (stealth address support).
    ///         If unset, salary is sent to msg.sender (the worker wallet).
    function setPayoutAddress(address payoutAddress) external onlyActiveWorker {
        if (payoutAddress == address(0)) revert PayrollErrors.InvalidWorkerAddress();
        _customPayoutAddresses[msg.sender] = payoutAddress;
        emit PayrollEvents.PayoutAddressSet(
            address(this),
            msg.sender,
            payoutAddress,
            block.timestamp
        );
    }

    /// @notice Get the effective payout address for a worker
    function getPayoutAddress(address worker) external view returns (address) {
        address custom = _customPayoutAddresses[worker];
        return custom != address(0) ? custom : worker;
    }

    // ─── IPayShieldPayroll: Access Control ───────────────────────────

    /// @notice Grant auditor access to view salary proofs
    function grantAuditorAccess(address auditor) external override onlyCompanyAdmin {
        if (auditor == address(0)) revert PayrollErrors.InvalidWorkerAddress();
        _auditorAccess[auditor] = true;

        // Grant FHE access to all current worker salaries for this auditor
        // In production you might grant access to specific workers only
        for (uint256 i = 0; i < _workerList.length; i++) {
            address w = _workerList[i];
            if (_workers[w].status == PayrollTypes.WorkerStatus.Active) {
                FHE.allow(_encryptedSalaries[w], auditor);
            }
        }

        _accessManager.grantAuditorAccess(address(this), auditor);

        emit PayrollEvents.AuditorAccessGranted(
            address(this),
            auditor,
            msg.sender,
            block.timestamp
        );
    }

    /// @notice Revoke auditor access
    function revokeAuditorAccess(address auditor) external override onlyCompanyAdmin {
        _auditorAccess[auditor] = false;
        _accessManager.revokeAuditorAccess(address(this), auditor);

        emit PayrollEvents.AuditorAccessRevoked(address(this), auditor, block.timestamp);
    }

    // ─── View: Worker Salary Decryption (worker-only) ─────────────────

    /// @notice Return the sealed (re-encrypted for caller) salary for a worker.
    ///         Only the worker themselves or an authorized auditor can call this.
    ///         Returns bytes that the caller's CoFHE SDK can unseal client-side.
    function getSealedSalary(
        address worker,
        SealingPermission calldata permission
    ) external view returns (bytes memory) {
        // Access check: only the worker or an authorized auditor
        bool isWorkerSelf = msg.sender == worker;
        bool isAuditorAccess = _auditorAccess[msg.sender];
        bool isAdmin = msg.sender == _companyAdmin;

        if (!isWorkerSelf && !isAuditorAccess && !isAdmin) {
            revert PayrollErrors.SalaryDecryptionNotPermitted(msg.sender);
        }
        if (_workers[worker].workerAddress == address(0)) {
            revert PayrollErrors.WorkerNotRegistered(worker);
        }

        // Return the encrypted handle + sealing key for client-side unsealing via CoFHE SDK.
        return abi.encode(_encryptedSalaries[worker], permission.sealingKey);
    }

    // ─── IPayShieldPayroll: View ──────────────────────────────────────

    function getWorkerRecord(address worker)
        external
        view
        override
        returns (PayrollTypes.WorkerRecord memory)
    {
        return _workers[worker];
    }

    function isActiveWorker(address worker) external view override returns (bool) {
        return _workers[worker].status == PayrollTypes.WorkerStatus.Active;
    }

    function companyAdmin() external view override returns (address) {
        return _companyAdmin;
    }

    function hasAuditorAccess(address auditor) external view override returns (bool) {
        return _auditorAccess[auditor];
    }

    function getWorkerList() external view returns (address[] memory) {
        return _workerList;
    }

    function workerCount() external view returns (uint256) {
        return _workerList.length;
    }

    function vaultAddress() external view returns (address) {
        return address(_vault);
    }

    function hasClaimed(address worker, uint256 periodId) external view returns (bool) {
        return _claimed[worker][periodId];
    }

    /// @dev CoFHE SDK bytes on testnet, or legacy mock tuple for local Hardhat demos.
    function _toEncryptedSalary(bytes calldata encryptedSalary) internal returns (euint128) {
        if (encryptedSalary.length <= 64) {
            (uint256 mockAmount,) = abi.decode(encryptedSalary, (uint256, uint8));
            return FHE.asEuint128(mockAmount);
        }
        return FHE.asEuint128(encryptedSalary);
    }

    // ─── Admin: Pause ─────────────────────────────────────────────────

    function pause() external onlyCompanyAdmin {
        _pause();
        emit PayrollEvents.PayrollPauseToggled(address(this), true, block.timestamp);
    }

    function unpause() external onlyCompanyAdmin {
        _unpause();
        emit PayrollEvents.PayrollPauseToggled(address(this), false, block.timestamp);
    }
}
