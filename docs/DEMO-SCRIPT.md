# PayShield Demo Script

This document is a step-by-step guide for judges running the local demo. Total time: ~5 minutes.

---

## Prerequisites

- Node.js 18+, pnpm 8+, Docker
- MetaMask or compatible wallet

---

## Setup (One-Time)

```bash
git clone https://github.com/your-org/payshield
cd payshield
pnpm install
```

---

## Step 1: Start Fhenix Local Node

```bash
cd packages/contracts
npx hardhat node:fhenix
```

This starts a local Fhenix node with CoFHE mock at `http://localhost:42069`.

Leave this running. Open a new terminal.

---

## Step 2: Deploy Contracts

```bash
cd packages/contracts
npx hardhat run scripts/deploy.ts --network localfhenix
```

Output:
```
✓ MockUSDC deployed:             0x5FbDB2315678afecb367f032d93F642f64180aa3
✓ AccessManager deployed:        0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
✓ PayShieldFactory deployed:     0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
✓ Deployments written to:        deployments/latest.json
✓ Env snippet written to:        deployments/env-snippet.txt
```

---

## Step 3: Seed Demo Payroll

```bash
npx hardhat run scripts/seedDemoPayroll.ts --network localfhenix
```

This creates a sample company with 3 workers:
- Alice: 5,000 USDC/month (encrypted)
- Bob: 7,500 USDC/month (encrypted)
- Carol: 12,000 USDC/month (encrypted)

And funds the vault with 50,000 mUSDC.

---

## Step 4: Start Frontend

```bash
# Copy contract addresses
cp packages/contracts/deployments/env-snippet.txt apps/web/.env.local

cd apps/web
pnpm dev
```

Open http://localhost:3000

---

## Demo Walkthrough

### Scene 1: The Problem (Landing Page)

Navigate to http://localhost:3000

Point out:
- On a normal chain, salary amounts appear in TX calldata and events
- Any block explorer can show: "Alice was paid 5000 USDC on March 1"
- This is unacceptable for real companies

### Scene 2: Company Creates Payroll

1. Connect MetaMask to `localhost:42069` (Fhenix local, chainId 412346)
2. Navigate to `/company/create-payroll`
3. Enter company name: "Demo Corp"
4. Click "Deploy Payroll Contracts"
5. Show: 3 contracts deployed atomically

### Scene 3: Add Worker with Encrypted Salary

1. Navigate to `/company` → "Employees" tab
2. Enter:
   - Worker Address: `0xWorkerAddress`
   - Employee ID: `alice-engineering`
   - Salary: `5000`
3. Click "Encrypt & Add Worker"
4. **Show the DevTools Network tab**: the TX calldata contains `0x[ciphertext]`, not `5000`
5. **Open MetaMask TX details**: same — no salary visible

### Scene 4: Verify On-Chain Privacy

Open the Hardhat console:

```bash
npx hardhat console --network localfhenix
```

```javascript
const payroll = await ethers.getContractAt("PayShieldPayroll", "0xPAYROLL_ADDRESS");
const worker = await payroll.getWorkerRecord("0xWORKER_ADDRESS");
console.log(worker.encryptedSalary);
// → 0x[128-byte ciphertext] — not 5000
```

### Scene 5: Worker Decrypts Salary

1. Switch MetaMask to the worker's account
2. Navigate to `/worker`
3. Enter payroll contract address
4. Click "Decrypt My Salary"
5. Show: salary appears as `$5,000.00`
6. Switch back to admin account, try again → "Not your salary" error

### Scene 6: Worker Claims

1. Stay on worker account
2. Click "Claim Monthly Salary"
3. Confirm in MetaMask
4. Show: USDC balance increases
5. Open Hardhat events: `SalaryClaimed` event has no salary amount

### Scene 7: Auditor View

1. Switch to a third account
2. Navigate to `/auditor`
3. Enter payroll address
4. Show: "Not Granted" — auditor access denied
5. Grant access from admin: `/company` → Auditors tab → grant address
6. Return to auditor view: can see worker count + vault balance
7. Individual salaries still show `●●●●●`

### Scene 8: The Attacker

Open any block explorer (or `eth_getStorageAt` directly):

```bash
# Try to read salary from storage
curl -X POST http://localhost:42069 \
  -d '{"method":"eth_getStorageAt","params":["0xPAYROLL","0x4","latest"]}' \
  -H "Content-Type: application/json"
# → 0x[ciphertext] — not readable
```

**Punchline**: Without breaking FHE, there is no way to recover a salary from the chain.

---

## Run Tests

```bash
cd packages/contracts
npx hardhat test
```

Tests cover:
- ✓ Company creates payroll
- ✓ Worker added with encrypted salary
- ✓ Encrypted salary unreadable from state
- ✓ Worker can claim (FHE decrypt inside claim)
- ✓ Unauthorized worker cannot claim
- ✓ Auditor access grant/revoke
- ✓ Vault underfunded prevents claim
- ✓ Inactive worker cannot claim

---

## Key Points for Judges

1. **The encryption is real** — not a mock or fake. The `@cofhe/hardhat-plugin` runs actual FHE operations locally.

2. **The privacy is cryptographic** — not just access control. FHE.allow() means decryption is mathematically impossible without the right key, not just blocked by a require() check.

3. **Events are privacy-preserving by design** — we explicitly do not emit salary amounts. See `PayrollEvents.sol` for the event definitions.

4. **The UX is practical** — a company admin can add workers and set salaries in a few clicks. The FHE complexity is abstracted by the SDK.

5. **Honest about limitations** — worker wallet addresses are still visible. We document this and have a roadmap for stealth addresses.
