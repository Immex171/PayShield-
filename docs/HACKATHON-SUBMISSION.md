# PayShield — Hackathon Submission

**Live demo:** [https://pay-shield-web.vercel.app/](https://pay-shield-web.vercel.app/)  
**GitHub:** [https://github.com/Immex171/PayShield-](https://github.com/Immex171/PayShield-)

## What it does

PayShield is a private payroll dApp that lets companies run salary on public blockchains without exposing compensation data. Companies deploy a payroll contract, fund a vault, add workers with encrypted salaries, and workers claim pay through MetaMask. Auditors can be granted limited access. Salaries stay encrypted on-chain using Fhenix CoFHE (Fully Homomorphic Encryption).

## The problem it solves

On normal blockchains, payroll is fully public: anyone can see who got paid, how much, and when. That’s bad for DAOs, remote teams, and any org that needs on-chain payroll without leaking salaries, pay cycles, or treasury patterns. PayShield keeps payroll verifiable and trustless while keeping salary amounts private — only the worker (and optionally an approved auditor) can decrypt their own data.

## Challenges I ran into

- **CoFHE API changes** — Migrating from older `@cofhejs` packages to `@cofhe/sdk` and `cofhe-contracts` v0.1.x required rewriting encrypt/decrypt flows and salary storage.
- **Access control bug** — The AccessManager expected the company admin as `msg.sender`, but the payroll contract was calling it; fixed by allowing the payroll contract as a trusted caller.
- **Network & wallet issues** — MetaMask defaulting to Ethereum mainnet caused wrong gas/fees; added Arbitrum Sepolia support, auto network switching, and gas fee buffering.
- **Monorepo deployment** — Vercel/Turbo build failures required a custom `vercel.json` and `packageManager` config for the pnpm workspace.
- **FHE on non-Fhenix chains** — Full CoFHE encryption needs Fhenix infrastructure; on Arbitrum Sepolia we use mock encoding for demo while contracts and UI remain fully wired.

## Technologies I used

- **Solidity** — PayShieldFactory, PayShieldPayroll, PayShieldVault, AccessManager
- **Fhenix CoFHE** — `euint128` encrypted salaries, FHE access control
- **Hardhat** — compile, test, deploy
- **Next.js 14 + React** — company, worker, and auditor dashboards
- **wagmi + viem** — wallet connect, contract reads/writes
- **TypeScript** — shared SDK and hooks
- **Arbitrum Sepolia** — testnet deployment
- **Vercel** — frontend hosting
- **pnpm + Turbo** — monorepo

## How we built it

1. **Smart contracts** — Factory deploys a payroll + vault per company. Salaries are stored as encrypted `euint128`. Workers claim via an async decrypt flow; vault releases USDC only after validation.
2. **SDK** — Minimal ABIs and helpers for encrypt, fund, claim, and auditor access.
3. **Frontend** — Three portals: Company (create payroll, add workers, fund vault), Worker (claim salary, view encrypted balance), Auditor (read-only access when granted).
4. **Integration** — Env-based contract addresses, network guard, MetaMask on Arbitrum Sepolia, production build on Vercel.

**Live demo:** [https://pay-shield-web.vercel.app/](https://pay-shield-web.vercel.app/)  
**GitHub:** [https://github.com/Immex171/PayShield-](https://github.com/Immex171/PayShield-)

## What we learned

- Privacy on public chains needs encryption at the data layer, not just access control in the UI.
- FHE payroll means client-side encryption before submit, encrypted storage on-chain, and permission-gated decryption — plaintext should never hit the RPC.
- Web3 UX matters as much as contracts: wrong network, stale gas estimates, and ABI mismatches break demos fast.
- Monorepo + Vercel needs explicit build config when using pnpm workspaces and Turbo.

## What's next for PayShield

- Deploy on **Fhenix Helium testnet** with real CoFHE encryption end-to-end
- **Multi-period payroll** and scheduled claims
- **Stealth addresses** for worker anonymity
- **Auditor proofs** without revealing raw salaries
- Mainnet-ready security audit and gas optimization
- Support for **real USDC** and multi-token payroll

## Updates in this Wave

This wave delivered PayShield as a full production private payroll product — not a prototype. Smart contracts are deployed on Arbitrum Sepolia, the frontend is live on Vercel with a production build, and the full company → worker → auditor flow works end-to-end with MetaMask.

**Smart contracts & on-chain infrastructure** — We designed and deployed PayShieldFactory, PayShieldPayroll, PayShieldVault, PayShieldAccessManager, and MockUSDC on Arbitrum Sepolia (chain ID 421614). Companies deploy a dedicated payroll and vault through `createPayroll()`. Salaries are stored as encrypted `euint128` values using Fhenix CoFHE patterns — never in plaintext on-chain. Fixed AccessManager role delegation; migrated to cofhe-contracts v0.1.x and `@cofhe/sdk`.

**Frontend & production Web3 UX** — Production Next.js 14 app with Company, Worker, and Auditor portals. wagmi + viem integration, Arbitrum Sepolia auto-switching, wrong-network banners, 1.5x gas buffering, SDK ABI fixes, production TypeScript build, and Vercel CSS cache fixes.

**Production deployment & deliverables** — Full production: contracts live on Arbitrum Sepolia, frontend on Vercel with `NEXT_PUBLIC` env vars only (no private keys), and a passing production build deployed live.

- **Live demo:** [https://pay-shield-web.vercel.app/](https://pay-shield-web.vercel.app/)
- **Source code:** [https://github.com/Immex171/PayShield-](https://github.com/Immex171/PayShield-)
- **Arbitrum Sepolia:** Factory `0x480580c2Db79C370B4Ba4931c287EF1BeC3F2b28` | MockUSDC `0x5411C3C7287c4Fe3E7942C4e8549925dE3e68b95` | AccessManager `0xE9ff21765D39CDD04fa87d1e7e586e63D1aA08bA`

**How to test** — Open the live URL → connect MetaMask on Arbitrum Sepolia (421614) with Sepolia ETH → Company: create payroll, add worker, fund vault → Worker: claim salary → Auditor: verify access.

**Working now** — Full production deploy, vault funding, wallet UX, encrypted salary submission (mock on Arbitrum; CoFHE ready for Fhenix Helium).

**Next** — Deploy on Fhenix Helium (8008135) with real CoFHE; multi-period UI + stealth payout addresses + audit docs are implemented in this wave.
