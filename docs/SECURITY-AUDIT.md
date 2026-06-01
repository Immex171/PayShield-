# PayShield Security Audit Readiness

This document tracks known risks, mitigations, and pre-mainnet audit checklist for PayShield.

## Scope

| Component | Path | Status |
|-----------|------|--------|
| PayShieldFactory | `packages/contracts/contracts/PayShieldFactory.sol` | MVP — needs audit |
| PayShieldPayroll | `packages/contracts/contracts/PayShieldPayroll.sol` | MVP — needs audit |
| PayShieldVault | `packages/contracts/contracts/PayShieldVault.sol` | MVP — needs audit |
| PayShieldAccessManager | `packages/contracts/contracts/PayShieldAccessManager.sol` | MVP — needs audit |
| Frontend (Next.js) | `apps/web/` | Production demo |
| CoFHE SDK integration | `apps/web/lib/cofheClient.ts`, `packages/sdk/` | Wired for Fhenix Helium |

## Known Privacy Limitations

1. **Plaintext USDC transfer on claim** — `PayShieldVault.releaseSalary()` emits a standard ERC-20 transfer. Observers can see the claimed amount even though salary storage is encrypted. Mitigation: v2 confidential token (`IConfidentialToken` stub exists).

2. **Worker wallet visibility** — Worker addresses are public in `addWorker()`. Mitigation: stealth payout addresses (`setPayoutAddress`) now supported.

3. **Claim timestamps** — `SalaryClaimed` events include period ID and timestamp (amount intentionally omitted).

4. **Mock FHE on non-Fhenix chains** — Arbitrum Sepolia uses mock salary encoding for demo; not production-grade FHE.

## Threat Model Summary

| Threat | Mitigation |
|--------|------------|
| Unauthorized salary read | FHE `euint128` + `FHE.allow` access control |
| Double claim | Per-period `_claimed[worker][periodId]` mapping |
| Reentrancy on claim | `nonReentrant` + CEI pattern |
| Unauthorized vault drain | Only authorized payroll can call `releaseSalary` |
| Admin impersonation | `onlyCompanyAdmin` modifier + AccessManager roles |
| Auditor overreach | Auditors get FHE allow on ciphertexts, not plaintext |

## Pre-Mainnet Audit Checklist

### Smart Contracts
- [ ] External security audit (Slither + manual review minimum)
- [ ] Run `npx hardhat test` — full suite passing
- [ ] Run `npx hardhat run scripts/verify.ts --network <network>` after deploy
- [ ] Gas optimization pass on claim + addWorker paths
- [ ] Formal verification of access control invariants (optional: Certora)
- [ ] Multi-sig for company admin (recommended for production)

### CoFHE / Fhenix
- [ ] End-to-end test on Fhenix Helium (chain 8008135) with real encryption
- [ ] Verify async decrypt flow (`DecryptionNotReady` retry) on testnet
- [ ] Confirm `getSealedSalary` + client unseal works for workers and auditors

### Frontend
- [ ] No private keys in env or Vercel
- [ ] CoFHE client initialized on wallet connect (`CofheInit`)
- [ ] Network guard enforces target chain
- [ ] Stealth keys stored in localStorage only — document key management for users

### Operations
- [ ] Incident response plan for compromised admin key
- [ ] Vault emergency withdraw procedure documented
- [ ] Upgrade path defined (current contracts are non-upgradeable by design)

## Running Static Analysis

```bash
# Install Slither (requires pip)
pip install slither-analyzer

# Run from contracts package
cd packages/contracts
slither . --exclude-dependencies
```

## Verify Deployed Contracts

```bash
# Fhenix Helium
make deploy-testnet
cd packages/contracts && npx hardhat run scripts/verify.ts --network fhenixTestnet

# Arbitrum Sepolia
make deploy-arbitrum-sepolia
cd packages/contracts && npx hardhat run scripts/verify.ts --network arbitrumSepolia
```

## Audit Contact Points

When engaging an auditor, provide:

1. This document + `docs/PRIVACY-MODEL.md` + `docs/ARCHITECTURE.md`
2. `packages/contracts/test/` — full Hardhat test suite
3. Deployed addresses from `packages/contracts/deployments/latest.json`
4. Live demo: https://pay-shield-web.vercel.app/

## Recent Security-Relevant Changes

- **AccessManager fix** — Payroll contract can register workers (trusted caller)
- **Stealth payout** — `setPayoutAddress()` decouples claim identity from payout destination
- **Multi-period claims** — `advancePeriod()` + per-period claim deduplication
- **CoFHE v0.1.x migration** — `createDecryptTask` + `getDecryptResultSafe` claim path
