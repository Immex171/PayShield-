import { parseAbi } from "viem";

export const PAYSHIELD_FACTORY_ABI = parseAbi([
  "function createPayroll(address token) returns (address payrollAddress, address vaultAddress)",
  "function getPayroll(address company) view returns (address)",
  "function getVault(address payroll) view returns (address)",
  "function hasPayroll(address company) view returns (bool)",
  "function totalPayrolls() view returns (uint256)",
  "function getAllPayrolls() view returns (address[])",
  "event PayrollCreated(address indexed company, address indexed payroll, address indexed vault, uint256 timestamp)",
]);

export const PAYSHIELD_PAYROLL_ABI = parseAbi([
  "function addWorker(address worker, bytes32 employeeIdHash, bytes calldata encryptedSalary)",
  "function updateWorkerSalary(address worker, bytes calldata newEncryptedSalary)",
  "function setWorkerStatus(address worker, bool active)",
  "function claimSalary()",
  "function prepareClaimDecrypt()",
  "function advancePeriod()",
  "function grantAuditorAccess(address auditor)",
  "function revokeAuditorAccess(address auditor)",
  "function getSealedSalary(address worker, (bytes32 sealingKey) permission) view returns (bytes)",
  "function getWorkerRecord(address worker) view returns ((address workerAddress, bytes32 employeeIdHash, uint8 status, uint256 registeredAt, uint256 lastClaimedAt, uint256 claimCount))",
  "function getWorkerList() view returns (address[])",
  "function workerCount() view returns (uint256)",
  "function vaultAddress() view returns (address)",
  "function isActiveWorker(address worker) view returns (bool)",
  "function hasAuditorAccess(address auditor) view returns (bool)",
  "function companyAdmin() view returns (address)",
  "function currentPeriodId() view returns (uint256)",
  "function periodStartedAt() view returns (uint256)",
  "function hasClaimed(address worker, uint256 periodId) view returns (bool)",
  "function setPayoutAddress(address payoutAddress)",
  "function getPayoutAddress(address worker) view returns (address)",
  "function paused() view returns (bool)",
  "function pause()",
  "function unpause()",
  "event WorkerRegistered(address indexed payroll, address indexed worker, bytes32 indexed employeeIdHash, uint256 timestamp)",
  "event SalaryUpdated(address indexed payroll, address indexed worker, uint256 timestamp)",
  "event SalaryClaimed(address indexed payroll, address indexed worker, uint256 indexed periodId, uint256 timestamp)",
  "event PeriodAdvanced(address indexed payroll, uint256 indexed periodId, uint256 timestamp)",
  "event PayoutAddressSet(address indexed payroll, address indexed worker, address indexed payoutAddress, uint256 timestamp)",
  "event AuditorAccessGranted(address indexed payroll, address indexed auditor, address indexed grantedBy, uint256 timestamp)",
  "event AuditorAccessRevoked(address indexed payroll, address indexed auditor, uint256 timestamp)",
]);

export const PAYSHIELD_VAULT_ABI = parseAbi([
  "function deposit(uint256 amount)",
  "function releaseSalary(address worker, uint256 amount)",
  "function emergencyWithdraw(uint256 amount)",
  "function getBalance() view returns (uint256)",
  "function token() view returns (address)",
  "function authorizedPayroll() view returns (address)",
  "function companyAdmin() view returns (address)",
  "event VaultFunded(address indexed payroll, address indexed vault, address indexed funder, uint256 amount, uint256 timestamp)",
]);

export const MOCK_USDC_ABI = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function faucet()",
  "function mint(address to, uint256 amount)",
]);

export const PAYSHIELD_ACCESS_MANAGER_ABI = parseAbi([
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function grantRole(bytes32 role, address account)",
  "function revokeRole(bytes32 role, address account)",
  "function COMPANY_ADMIN() view returns (bytes32)",
  "function WORKER_ROLE() view returns (bytes32)",
  "function AUDITOR_ROLE() view returns (bytes32)",
]);
