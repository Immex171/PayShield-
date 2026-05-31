# PayShield Privacy Model

## Threat Model

PayShield assumes the following threat actors:

| Actor | Access | Threat |
|---|---|---|
| Chain observers | Full transaction history | Salary inference from amounts |
| Mempool watchers | Pending transactions | Pre-broadcast salary extraction |
| Block explorers | Storage slots, events | On-chain salary lookup |
| Other workers | Contract state | Cross-worker salary comparison |
| Unauthorized auditors | Contract ABI | Mass salary extraction |
| Malicious company admin | Admin role | Salary re-encryption for admin |

---

## Privacy Layers

### Layer 1: Client-Side Encryption (Mempool)

Salary is encrypted in the browser before the transaction is signed:

```
User enters: 5000 USDC
             ↓
cofheClient.encrypt_uint128(5000_000000n)
             ↓
TX calldata: addWorker(0xWorker, 0xHash, 0xABCDEF...)
                                          ^^^^^^^^
                            This is a ciphertext, not 5000
```

**Protection against**: mempool observers, node operators.

### Layer 2: FHE Contract Storage (Chain State)

The contract stores `euint128` — a Fhenix FHE ciphertext:

```solidity
// This is what's in the storage slot:
workers[addr].encryptedSalary = 0x[128-byte ciphertext]

// Nobody reading state can recover 5000 without:
// 1. Holding the FHE private key shard (distributed across Fhenix validators)
// 2. Having been granted FHE.allow() permission
```

**Protection against**: block explorers, chain analysis tools, Etherscan.

### Layer 3: Selective FHE Decryption (Access Control)

`FHE.allow()` cryptographically gates who can decrypt:

```solidity
FHE.allow(encSalary, worker);       // worker can decrypt their own
FHE.allow(encSalary, address(this)); // contract can compute (claim)
// NOT allowed: admin, auditors, other workers
```

**Protection against**: company admin snooping on workers, workers comparing salaries, unauthorized auditors.

### Layer 4: Event Log Privacy

Events intentionally omit salary amounts:

```solidity
// What we emit (no salary):
emit WorkerRegistered(payroll, worker, employeeIdHash, block.timestamp);
emit SalaryClaimed(payroll, worker, periodId, block.timestamp);

// What we do NOT emit:
// emit WorkerRegistered(..., salary); // ← NOT emitted
```

**Protection against**: event log scrapers, subgraph indexers.

### Layer 5: Employee Identity Hashing

Employee IDs are hashed before being stored:

```solidity
bytes32 idHash = keccak256(abi.encodePacked(employeeId, workerAddress));
// "alice-engineering" is never stored
// 0x3f2a... is stored
```

**Protection against**: HR data exposure, employee enumeration.

---

## What Remains Visible

PayShield intentionally makes the following visible for auditability:

| Data | Why Visible |
|---|---|
| Worker wallet addresses | Required for payment routing |
| Worker active/inactive status | Required for claim validation |
| Claim timestamps | Required for payroll period tracking |
| Vault balance | Required for solvency verification |
| Worker count | Required for auditor verification |
| Transfer amounts at claim time | ERC-20 transfer is public |

### Residual Privacy Risks

1. **Transfer amount correlation**: When a worker claims, `USDC.transfer(worker, amount)` reveals the salary to transfer observers. Mitigation: confidential token payout (v2 roadmap).

2. **Timing analysis**: Regular monthly claims reveal payroll cycles. Mitigation: workers can choose when to claim.

3. **Wallet-to-identity linking**: If a worker's wallet is publicly associated with their identity, their employment is visible. Mitigation: stealth addresses (v3 roadmap).

---

## FHE Trust Model

Fhenix CoFHE uses **threshold decryption**: no single entity holds the full FHE private key. Key shares are held by distributed Fhenix validators.

- **Decrypt inside computation**: `FHE.decrypt()` triggers threshold signing by validators — the plaintext is never exposed to any single party, including Fhenix itself.
- **Sealed output**: `FHE.sealOutput()` re-encrypts under the caller's public key — only the caller can unseal.

---

## Audit vs Privacy Balance

| Capability | Worker | Company Admin | Auditor | Public |
|---|---|---|---|---|
| View own salary | ✓ (FHE sealed) | ✗ | ✗ | ✗ |
| View other salary | ✗ | ✗ | ✗ | ✗ |
| View worker count | ✓ | ✓ | ✓ (if granted) | ✗ |
| View vault balance | ✓ | ✓ | ✓ (if granted) | ✗ |
| View claim history | Own only | All | All (if granted) | ✗ |
| Grant auditor access | ✗ | ✓ | ✗ | ✗ |
| Pause contract | ✗ | ✓ | ✗ | ✗ |

---

## Comparison: Public Chain Payroll vs PayShield

| | Public Chain Payroll | PayShield |
|---|---|---|
| Salary stored as | `uint256` plaintext | `euint128` FHE ciphertext |
| TX mempool | Salary visible | Ciphertext only |
| Block explorer | Salary readable | Opaque bytes |
| Event logs | Salary emitted | Timestamps only |
| Employee names | Plaintext or hash | Hash only |
| Auditor access | All or nothing | Aggregate only, no salaries |
