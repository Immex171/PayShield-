// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title IConfidentialToken
/// @notice Adapter interface for confidential token integrations (Privara, Reineira, etc.)
/// @dev This enables PayShield to plug in confidential ERC-20 tokens in the future
/// without changing the core payroll logic. For MVP, MockUSDC is used.
interface IConfidentialToken {
    /// @notice Transfer tokens confidentially — amount is encrypted
    /// @param to Recipient address
    /// @param encryptedAmount CoFHE-encrypted transfer amount
    function confidentialTransfer(
        address to,
        bytes calldata encryptedAmount
    ) external returns (bool);

    /// @notice Get encrypted balance of an account
    /// @param account Address to check
    /// @return encryptedBalance Encrypted balance (viewable only by owner via FHE access control)
    function encryptedBalanceOf(address account)
        external
        view
        returns (bytes memory encryptedBalance);

    /// @notice Standard ERC-20-like transfer (plaintext, for MVP compatibility)
    function transfer(address to, uint256 amount) external returns (bool);

    /// @notice Standard ERC-20-like transferFrom
    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    /// @notice Approve spender
    function approve(address spender, uint256 amount) external returns (bool);

    /// @notice Get token decimals
    function decimals() external view returns (uint8);

    /// @notice Get token symbol
    function symbol() external view returns (string memory);
}
