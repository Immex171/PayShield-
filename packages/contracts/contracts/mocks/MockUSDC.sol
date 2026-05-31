// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @title MockUSDC
/// @notice A simple ERC-20 mock token representing USDC for local testing.
/// @dev In production, PayShield would integrate with real USDC or a confidential token.
///      This mock has a public faucet so any test address can self-fund.
contract MockUSDC is ERC20, Ownable {
    uint8 private constant _DECIMALS = 6;
    uint256 public constant FAUCET_AMOUNT = 100_000 * 10 ** 6; // 100,000 USDC per claim

    mapping(address => uint256) public lastFaucetClaim;
    uint256 public constant FAUCET_COOLDOWN = 1 hours;

    event FaucetClaimed(address indexed claimer, uint256 amount, uint256 timestamp);

    constructor() ERC20("Mock USDC", "mUSDC") Ownable(msg.sender) {
        // Mint initial supply to deployer for testing
        _mint(msg.sender, 10_000_000 * 10 ** _DECIMALS); // 10M mUSDC
    }

    /// @notice Override decimals to match real USDC (6 decimals)
    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    /// @notice Public faucet — any address can claim test tokens (once per hour)
    function faucet() external {
        require(
            block.timestamp >= lastFaucetClaim[msg.sender] + FAUCET_COOLDOWN,
            "MockUSDC: Cooldown active, try again later"
        );
        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT, block.timestamp);
    }

    /// @notice Owner can mint arbitrary amounts for test seeding
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Format a USDC amount for display (returns units.decimals string)
    function formatAmount(uint256 amount) external pure returns (string memory) {
        uint256 units = amount / 10 ** _DECIMALS;
        uint256 cents = (amount % 10 ** _DECIMALS) / 10 ** (_DECIMALS - 2);
        return string(abi.encodePacked(_uintToStr(units), ".", _pad2(cents)));
    }

    function _uintToStr(uint256 v) internal pure returns (string memory) {
        if (v == 0) return "0";
        uint256 temp = v;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (v != 0) { digits--; buffer[digits] = bytes1(uint8(48 + v % 10)); v /= 10; }
        return string(buffer);
    }

    function _pad2(uint256 v) internal pure returns (string memory) {
        if (v < 10) return string(abi.encodePacked("0", _uintToStr(v)));
        return _uintToStr(v);
    }
}
