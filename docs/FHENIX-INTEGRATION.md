# Fhenix CoFHE Integration

## What is CoFHE?

Fhenix CoFHE (Coprocessor Fully Homomorphic Encryption) is an EVM-compatible FHE framework. It allows smart contracts to store and compute over encrypted values without decrypting them. The key insight: computation happens on ciphertexts, producing ciphertexts — no plaintext ever touches a node.

PayShield uses CoFHE to store salary amounts as `euint128` — encrypted 128-bit unsigned integers — that can only be decrypted by authorized parties.

---

## Packages Used

```json
{
  "@fhenixprotocol/cofhe-contracts": "^0.3.0",
  "@cofhe/hardhat-plugin": "^0.3.0",
  "@cofhe/sdk": "^0.3.0"
}
```

Frontend:
```json
{
  "@cofhe/sdk": "^0.3.0"
}
```

---

## Contract Integration

### Import

```solidity
import "@fhenixprotocol/cofhe-contracts/FHE.sol";
```

### Encrypted Input Type

Clients encrypt a `uint128` and submit it as `InEuint128`:

```solidity
// InEuint128 is a struct: { bytes32 ctHash, uint8 securityZone }
function addWorker(
    address worker,
    bytes32 employeeIdHash,
    bytes calldata encryptedSalary   // ABI-encoded InEuint128
) external onlyAdmin {
    InEuint128 memory inSalary = abi.decode(encryptedSalary, (InEuint128));
    euint128 encSalary = FHE.asEuint128(inSalary);  // validate + store
    ...
}
```

### FHE Access Control

After creating the ciphertext, grant access to specific addresses:

```solidity
// Only the worker can decrypt their own salary
FHE.allow(encSalary, worker);

// The payroll contract itself needs access for claimSalary()
FHE.allow(encSalary, address(this));

// Explicitly NOT allowed: company admin, other workers, auditors
```

### Claim Salary (Threshold Decrypt)

```solidity
function claimSalary() external {
    euint128 encSalary = workers[msg.sender].encryptedSalary;
    
    // FHE.decrypt triggers threshold decryption by Fhenix validators
    // The plaintext is visible only inside this EVM execution context
    uint128 salaryAmount = FHE.decrypt(encSalary);
    
    vault.releaseSalary(msg.sender, salaryAmount);
    
    // Emit without the amount — privacy preserved in event logs
    emit SalaryClaimed(address(this), msg.sender, currentPeriodId, block.timestamp);
}
```

### Sealed Output (Worker View Salary)

The worker can request their salary re-encrypted under their own public key:

```solidity
function getSealedSalary(
    address worker,
    Permission calldata permission
) external view returns (bytes memory) {
    require(msg.sender == worker, "Not your salary");
    euint128 encSalary = workers[worker].encryptedSalary;
    return FHE.sealOutput(encSalary, permission);
}
```

On the client side:

```typescript
const permission = await cofheClient.generatePermission(payrollAddr, workerAddr);
const sealedResult = await payroll.getSealedSalary(workerAddr, permission);
const salary = await cofheClient.unseal(sealedResult);
// → salary is uint128 in browser memory only
```

---

## SDK Integration (Frontend)

### Initialize CoFHE Client

```typescript
import { getCofheClient } from '@/lib/cofheClient';

const cofheClient = await getCofheClient();
```

### Encrypt Salary

```typescript
// salary: bigint in smallest unit (e.g., 5000 USDC = 5000_000000n)
const encryptedInput = await cofheClient.encrypt_uint128(5000_000000n);
// Returns: { ctHash: "0x...", securityZone: 0 }
```

### Generate Permission

```typescript
const permission = await cofheClient.generatePermission(
  payrollContractAddress,
  workerWalletAddress
);
```

### Unseal

```typescript
const sealedBytes = await payroll.getSealedSalary(workerAddr, permission);
const plaintext = await cofheClient.unseal(sealedBytes);
// plaintext is bigint (uint128 salary in token units)
```

---

## Local Mock Environment

The `@cofhe/hardhat-plugin` provides a local FHE mock for testing. The mock:

- Encrypts values using a local key (not threshold distributed)
- Allows `FHE.decrypt()` to return values in tests
- Allows encrypted comparisons and operations for test assertions

```typescript
// In Hardhat tests:
import { getFHE } from "@cofhe/hardhat-plugin";

const fhe = await getFHE();
const encrypted = await fhe.encrypt_uint128(5000_000000n);

// After claimSalary() tx, assert on the transfer event or token balance
// (Cannot directly assert on euint128 values from JS — use balance changes)
```

---

## Network Config

```typescript
// Fhenix Local Node (Docker)
{
  chainId: 412346,
  rpcUrl: "http://localhost:42069",
  name: "localfhenix"
}

// Fhenix Helium Testnet
{
  chainId: 8008135,
  rpcUrl: "https://api.helium.fhenix.zone",
  name: "fhenixHelium"
}
```

---

## FHE Type Reference

| Solidity Type | JS Client Type | Size | PayShield Use |
|---|---|---|---|
| `euint128` | n/a (opaque on-chain) | 128-bit | Salary storage |
| `InEuint128` | `EncryptedUint128` | 128-bit | Input type for salary |
| `Permission` | `Permission` | struct | Sealed output authorization |

---

## Known Limitations

1. **Mock vs Production**: The local mock uses a centralized key. Production Fhenix uses distributed threshold keys. The API is identical.

2. **Gas**: FHE operations are significantly more gas-intensive than plaintext. `FHE.decrypt()` in particular triggers a threshold signing round.

3. **Latency**: `FHE.sealOutput()` on testnet has added latency due to the threshold network round-trip (~1-3 seconds).

4. **euint128 max**: 2^128 - 1 ≈ 340 undecillion. More than sufficient for USDC with 6 decimals.
