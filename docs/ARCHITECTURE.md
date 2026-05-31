# PayShield Architecture

## Overview

PayShield is a monorepo with three layers: smart contracts, an SDK, and a Next.js frontend. Each layer is a separate package with its own dependencies.

```
payshield/
├── apps/web/                  Next.js 14 frontend
├── packages/contracts/        Solidity + Hardhat
├── packages/sdk/              Client helper library
└── packages/shared/           Constants + types
```

---

## Smart Contract Architecture

### Deployment Graph

```
EOA (Company Admin)
    │
    ↓ createPayroll(name, token)
PayShieldFactory
    │
    ├─→ new PayShieldPayroll(admin, token, accessManager)
    │         │
    │         ├── Worker registry (mapping)
    │         ├── euint128 salary storage (FHE encrypted)
    │         ├── Claim logic
    │         └── Auditor FHE access grants
    │
    ├─→ new PayShieldVault(admin, token, payroll)
    │         │
    │         ├── USDC custody
    │         └── releaseSalary() gated to payroll only
    │
    └─→ new PayShieldAccessManager(admin)
              │
              ├── COMPANY_ADMIN role
              ├── WORKER_ROLE
              └── AUDITOR_ROLE
```

### Contract Interaction: Add Worker

```
Admin wallet (browser)
    │
    ├── 1. cofheClient.encrypt_uint128(salary)
    │       → InEuint128 { ctHash, securityZone }
    │
    └── 2. payroll.addWorker(worker, idHash, encryptedSalary)
              │
              ├── FHE.asEuint128(inSalary)     // validate + store
              ├── FHE.allow(encSalary, worker) // gate decryption
              └── emit WorkerRegistered(...)    // no salary in event
```

### Contract Interaction: Claim Salary

```
Worker wallet (browser)
    │
    └── 1. payroll.claimSalary()
              │
              ├── FHE.decrypt(encryptedSalary) // threshold decrypt
              │       → uint128 salaryAmount (visible only inside EVM)
              │
              └── vault.releaseSalary(worker, salaryAmount)
                        │
                        └── IERC20.transfer(worker, salaryAmount)
                                // → only transfer amount visible, not salary record
```

### Contract Interaction: View Salary (Worker Only)

```
Worker wallet (browser)
    │
    ├── 1. cofheClient.generatePermission(payrollAddr, workerAddr)
    │       → Permission { sealingKey }
    │
    ├── 2. payroll.getSealedSalary(workerAddr, permission)
    │       │
    │       └── FHE.sealOutput(encryptedSalary, permission)
    │               → sealed ciphertext (re-encrypted for caller)
    │
    └── 3. cofheClient.unseal(sealedCiphertext)
            → uint128 salary (plaintext in browser memory only)
```

---

## Data Model

### Worker Record (on-chain)

```solidity
struct WorkerRecord {
    address workerAddress;
    bytes32 employeeIdHash;     // keccak256(employeeId, workerAddr) — never plaintext
    euint128 encryptedSalary;   // FHE ciphertext — never plaintext
    WorkerStatus status;        // ACTIVE / INACTIVE / REMOVED
    uint256 registeredAt;
    uint256 lastClaimedAt;
    uint256 claimCount;
}
```

### Privacy Properties

| Field | On-chain visibility | Notes |
|---|---|---|
| `workerAddress` | Public | Wallet address visible (stealth address: future roadmap) |
| `employeeIdHash` | Public | Derived hash only — not reversible |
| `encryptedSalary` | Opaque | FHE ciphertext — computationally infeasible to recover |
| `status` | Public | Active/inactive flag |
| `lastClaimedAt` | Public | Timestamp visible (timing analysis possible) |

---

## FHE Integration

PayShield uses Fhenix CoFHE with the following primitives:

| Primitive | Use in PayShield |
|---|---|
| `InEuint128` | Input type for encrypted salary from client |
| `euint128` | On-chain storage type |
| `FHE.asEuint128()` | Convert + validate encrypted input |
| `FHE.allow()` | Gate which addresses can decrypt |
| `FHE.sealOutput()` | Re-encrypt for caller's public key |
| `FHE.decrypt()` | Threshold decrypt inside claim logic |

See [FHENIX-INTEGRATION.md](FHENIX-INTEGRATION.md) for implementation details.

---

## Frontend Architecture

```
apps/web/
├── app/              Next.js App Router pages
│   ├── page.tsx      Landing page
│   ├── company/      Company dashboard, create payroll
│   ├── worker/       Worker portal, claim
│   ├── auditor/      Auditor view
│   └── demo/         Judge demo walkthrough
├── components/       React components by domain
├── hooks/            wagmi-based contract hooks
└── lib/              cofheClient, wagmi config, addresses
```

Key frontend flows:
- `useEncryptPayroll` → encrypts salary client-side, submits addWorker TX
- `useWorkerPayroll` → calls getSealedSalary, unseals in browser
- `useClaimSalary` → calls claimSalary, waits for confirmation
- `useAuditorAccess` → grant/revoke auditor role

---

## Security Considerations

- FHE access control is cryptographic, not just permission checks
- `FHE.allow()` must be called before any decryption is possible
- Emergency pause is available to admin via `pause()` / `unpause()`
- Vault uses `ReentrancyGuard` on `releaseSalary()`
- SafeERC20 used throughout for token operations
- Employee ID never stored — only its hash

## Known Limitations (MVP)

- Worker wallet addresses are still visible on-chain (timing + identity analysis possible)
- Token transfer amounts are visible when salary is released (amount = salary)
- No recurring payroll automation (v4 roadmap)
- No confidential token support yet (v2 roadmap)
