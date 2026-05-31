# PayShield Testing Guide

## Setup

```bash
cd packages/contracts
pnpm install
```

The `@cofhe/hardhat-plugin` is configured in `hardhat.config.ts` and automatically initializes the CoFHE mock environment for all test runs.

---

## Run Tests

```bash
# All tests
npx hardhat test

# With gas reporting
REPORT_GAS=true npx hardhat test

# Single file
npx hardhat test test/PayShieldPayroll.test.ts

# Verbose
npx hardhat test --verbose
```

---

## Test Coverage

### PayShieldPayroll.test.ts

| Test | Description |
|---|---|
| Company creates payroll via factory | Factory deploys and links contracts |
| Admin adds worker with encrypted salary | Worker registered, salary stored as euint128 |
| Encrypted salary cannot be read by non-worker | FHE access control enforced |
| Worker can claim salary | FHE.decrypt succeeds, vault releases funds |
| Inactive worker cannot claim | Status check enforced |
| Admin can update encrypted salary | New ciphertext replaces old |
| Salary update emits no plaintext | Event inspection |
| Admin can pause/unpause payroll | Emergency controls |

### PayShieldVault.test.ts

| Test | Description |
|---|---|
| Vault accepts deposits | USDC transferred in |
| Only authorized payroll can release salary | Access gating |
| Vault rejects release if underfunded | Balance check |
| Admin can emergency withdraw | Admin control |
| releaseSalary is reentrancy-safe | ReentrancyGuard |

### accessControl.test.ts

| Test | Description |
|---|---|
| Only admin can add workers | Role check |
| Only admin can grant auditor access | Role check |
| Auditor cannot decrypt individual salaries | FHE access control |
| Non-worker cannot call claimSalary | Worker check |
| Unauthorized user gets zero from getSealedSalary | FHE permission check |
| Admin can revoke auditor access | Role revocation |

---

## Test Patterns

### Encrypted Value Tests

Since `euint128` values are opaque from TypeScript, we test FHE privacy by:

1. **Balance changes**: Assert on `token.balanceOf()` before and after claim
2. **Event inspection**: Assert events do NOT contain salary amounts
3. **Error assertions**: Assert unauthorized callers get reverted

```typescript
// Testing that encrypted salary is private:
const workerRecord = await payroll.getWorkerRecord(workerAddr);
// euint128 returns as a handle (bytes32) — not a readable uint128
expect(workerRecord.encryptedSalary).to.not.equal(ethers.toBigInt(5000_000000));
// It should be a ciphertext handle, not the raw value

// Testing claim works (via balance change):
const before = await usdc.balanceOf(workerAddr);
await payroll.connect(worker).claimSalary();
const after = await usdc.balanceOf(workerAddr);
expect(after - before).to.equal(5000_000000n);
```

### Mock Encryption

```typescript
import { FhenixClient } from "@cofhe/sdk";

// In tests, the mock client uses a local key
const client = new FhenixClient({ provider: ethers.provider });
const encrypted = await client.encrypt_uint128(5000_000000n);
// → InEuint128 { ctHash: "0x...", securityZone: 0 }
```

---

## CI/CD

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: |
    cd packages/contracts
    npx hardhat test
```

No Docker required for tests — the CoFHE mock runs in-process via the Hardhat plugin.

---

## Debugging

### FHE errors

If `FHE.asEuint128()` reverts with "invalid proof":
- Ensure you're passing a real `InEuint128` struct (not a raw uint)
- The mock client's ctHash must be a `bytes32` value

### Event not found

Events with `indexed bytes32` parameters must be decoded with `ethers.toUtf8String()` or raw hex.

### Vault underfunded

Ensure `seedDemoPayroll.ts` ran before testing claim flows, or call `vault.deposit()` directly in test setup.
