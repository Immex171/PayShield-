# PayShield Roadmap

## Current: v1 (MVP — Buildathon)

**Status**: Complete on Fhenix Helium testnet + local mock

- ✓ PayShieldFactory, Payroll, Vault, AccessManager contracts
- ✓ `euint128` FHE salary storage
- ✓ Client-side salary encryption via CoFHE SDK
- ✓ Worker claim flow with `FHE.decrypt()`
- ✓ Sealed salary view via `FHE.sealOutput()`
- ✓ Auditor access: aggregate only, no individual salaries
- ✓ Company dashboard (Next.js)
- ✓ Worker portal
- ✓ Hardhat test suite

---

## v2: Confidential Token Payouts

**Problem**: The USDC transfer on claim still reveals the salary amount to observers (`Transfer(worker, amount)`).

**Solution**: Integrate with a confidential ERC-20 token (e.g., Fhenix Privara or a Reineira FHE-native USDC adapter) where transfer amounts are also encrypted.

```
Current:  USDC.transfer(worker, 5000)    ← visible
v2:       ConfUSDC.transferEncrypted(worker, euint128(salary))  ← private
```

**Work required**: `IConfidentialToken.sol` adapter (already stubbed in `interfaces/`), Privara integration, frontend claim flow update.

---

## v3: Stealth Worker Addresses

**Problem**: Worker wallet addresses are visible on-chain. Observers can link a wallet to a person.

**Solution**: Implement stealth address generation. The company sends salary to a one-time stealth address derived from the worker's viewing key. The worker scans the chain to find their address using their private key.

**Work required**: ERC-5564 stealth address registry, client-side stealth key scanning, updated worker portal.

---

## v4: Recurring Payroll Automation

**Problem**: Company admin must manually trigger each pay period.

**Solution**: Encrypted payroll scheduler — automate monthly claims without revealing payment amounts or timing.

Options:
- Chainlink Automation (if off-chain trigger is acceptable)
- On-chain epoch-based auto-claim with FHE-gated release
- Gelato Network keeper with private calldata

---

## v5: DAO Governance for Salary Updates

**Problem**: Single company admin has unilateral control over salary updates.

**Solution**: Multi-sig salary approval. Salary changes require N-of-M signatures from a company governance council, all operating on encrypted values.

```solidity
// Proposed: salary update requires 2-of-3 council approval
function proposeSalaryUpdate(address worker, InEuint128 newSalary) external;
function approveSalaryUpdate(uint256 proposalId) external;
// executes when threshold reached
```

---

## v6: ZK Proof of Payment for Contractors

**Problem**: Contractors need to prove they were paid without revealing the amount.

**Solution**: Generate a ZK proof (e.g., Groth16 or PLONK) that:
- A salary claim occurred at timestamp T
- The amount was above a threshold X
- Without revealing the exact amount

This enables contractor invoicing and employment verification with selective disclosure.

---

## v7: Cross-Chain Payroll

**Problem**: Some workers or companies operate on different chains.

**Solution**: Bridge PayShield payroll instructions to other EVM chains using:
- Axelar General Message Passing
- Fhenix → target chain FHE bridge (future Fhenix roadmap)
- Encrypted payroll state synced across chains

---

## v8: Enterprise Compliance Dashboard

**Problem**: Regulated companies need compliance reporting without exposing individual salaries to auditors.

**Solution**: Zero-knowledge aggregate statistics dashboard:
- Total payroll expense (encrypted + ZK-proven)
- Pay equity ratios (without individual disclosure)
- Regulatory compliance reports (tax, labor law)

---

## Non-Goals

PayShield intentionally does not:
- Replace HR systems (identity, onboarding, performance)
- Handle fiat off-ramps (out of scope for Web3 payroll)
- Support token vesting (separate product domain)
- Provide tax calculation (requires off-chain data and legal advice)
