// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title IPayShieldVault
/// @notice Interface for the PayShield payroll vault
interface IPayShieldVault {
    /// @notice Deposit tokens into the vault to fund payroll
    /// @param amount Amount of tokens to deposit
    function deposit(uint256 amount) external;

    /// @notice Release salary to a worker — only callable by the associated payroll contract
    /// @param worker Recipient worker address
    /// @param amount Token amount to release
    function releaseSalary(address worker, uint256 amount) external;

    /// @notice Emergency withdrawal by company admin
    /// @param amount Amount to withdraw
    function emergencyWithdraw(uint256 amount) external;

    /// @notice Get current vault balance
    function getBalance() external view returns (uint256);

    /// @notice Get the token address held by this vault
    function token() external view returns (address);

    /// @notice Get the payroll contract authorized to call releaseSalary
    function authorizedPayroll() external view returns (address);
}
