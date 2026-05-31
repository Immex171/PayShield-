# PayShield 🔐

> **Private payroll for public blockchains.**

PayShield is a confidential payroll dApp for companies, DAOs, and Web3 teams. On standard EVM chains, every salary payment is publicly visible — amounts, timing, wallet addresses. PayShield solves this using **Fhenix CoFHE** (Coprocessor Fully Homomorphic Encryption) to encrypt salary records on-chain, enabling private worker claims and selective auditor disclosure.

---

## The Problem

Public blockchain payroll exposes:
- Every worker's exact salary
- Payment timing (revealing contractor relationships)
- Treasury movements (exposing runway)
- Worker-to-wallet identity links

This makes transparent rails unsuitable for real companies. The privacy problem cannot be solved by off-chain workarounds — the payment itself must settle on-chain.

## The Solution

PayShield encrypts salaries **before they leave the browser**. The ciphertext is stored on Fhenix as a `euint128` — an FHE-encrypted 128-bit integer. Only authorized wallets can decrypt their own data, enforced at the cryptographic level, not by access control alone.

```
Browser:  salary = 5000 USDC
          encrypted = cofheClient.encrypt_uint128(5000_000000n)
          ↓ transmit ciphertext, not plaintext
Chain:    workers[addr].salary = FHE.asEuint128(encryptedInput)  // opaque
          FHE.allow(salary, worker)  // only worker can decrypt
```

---

## Architecture

```
PayShieldFactory
  ↓ deploys
  ├── PayShieldPayroll   — worker registry, FHE salary storage
  ├── PayShieldVault     — USDC custody, salary release
  └── AccessManager      — ADMIN / WORKER / AUDITOR roles
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full contract interaction diagram.

---

## Tech Stack

| Layer | Tech |
|---|---|
| FHE | Fhenix CoFHE, `@fhenixprotocol/cofhe-contracts` |
| Contracts | Solidity 0.8.24, Hardhat, `@cofhe/hardhat-plugin` |
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Web3 | wagmi v2, viem, `@cofhe/sdk/web` |
| Monorepo | pnpm workspaces, Turbo |

---

## Contracts

| Contract | Description |
|---|---|
| `PayShieldFactory.sol` | Deploys payroll systems, maps admin → payroll |
| `PayShieldPayroll.sol` | Worker registry, `euint128` salary storage, claim logic |
| `PayShieldVault.sol` | USDC custody, authorized release to workers |
| `PayShieldAccessManager.sol` | Role-based FHE access control |
| `MockUSDC.sol` | Test token with faucet |

---

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker (for Fhenix local node)

### Install

```bash
git clone https://github.com/your-org/payshield
cd payshield
pnpm install
```

### Run Tests

```bash
cd packages/contracts
npx hardhat test
```

### Deploy Locally

```bash
# Terminal 1: Start Fhenix local node
cd packages/contracts
npx hardhat node:fhenix

# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy.ts --network localfhenix

# Terminal 3: Seed demo data
npx hardhat run scripts/seedDemoPayroll.ts --network localfhenix
```

### Run Frontend

```bash
# Copy deployment addresses
cp packages/contracts/deployments/env-snippet.txt apps/web/.env.local

cd apps/web
pnpm dev
# → http://localhost:3000
```

### Deploy to Fhenix Helium Testnet

```bash
# Set up .env
cp .env.example .env
# Add PRIVATE_KEY, HELIUM_RPC_URL

cd packages/contracts
npx hardhat run scripts/deploy.ts --network fhenixHelium
```

---

## Demo Flow

1. **Company** connects wallet → creates payroll contract
2. **Company** adds worker, enters salary → encrypted client-side via CoFHE
3. **Company** funds vault with mUSDC
4. **Worker** connects wallet → views encrypted salary, requests FHE-sealed decryption
5. **Worker** claims monthly salary → vault releases funds
6. **Auditor** (if granted) views worker count + vault balance, but not individual salaries

See [docs/DEMO-SCRIPT.md](docs/DEMO-SCRIPT.md) for the step-by-step guide.

---

## Privacy Guarantees

- Salary amount never stored as plaintext in any storage slot
- Salary never appears in transaction calldata as plaintext
- Salary never emitted in event logs
- Employee names replaced by `keccak256(employeeId, workerAddress)` hashes
- Block explorers see only `0x[ciphertext]` for salary fields

See [docs/PRIVACY-MODEL.md](docs/PRIVACY-MODEL.md) for the full privacy analysis.

---

## Future Roadmap

- **v2**: Confidential token payouts (no visible transfer amounts)
- **v3**: Stealth worker addresses (wallet-to-person link broken)
- **v4**: Recurring automated payroll with encrypted scheduling
- **v5**: Multi-sig company admin, DAO governance for salary updates
- **v6**: ZK proof of payment for contractor invoicing

See [docs/ROADMAP.md](docs/ROADMAP.md) for details.

---

## Buildathon Note

This is a buildathon MVP using the Fhenix Helium testnet and local CoFHE mock environment. The FHE operations are real (not simulated) — the mock simply uses a local key instead of the distributed Fhenix threshold network. Do not use in production without a full security audit.

---

## License

MIT
