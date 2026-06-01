# Deploy to Fhenix Helium (chain 8008135)

Run these commands **on your machine** (Fhenix RPC is not reachable from some CI/sandbox environments).

## Prerequisites

1. Copy `.env.example` → `.env.local` at repo root and set `DEPLOYER_PRIVATE_KEY`
2. Fund deployer with **tFHE** on Fhenix Helium ([Discord faucet](https://discord.gg/fhenix-io) or [bridge](https://bridge.helium.fhenix.zone))
3. Wallet should be on chain **8008135**

## Deploy + seed

```bash
# From repo root (uses .env.local — never commit this file)
make deploy-testnet-full
```

Or manually:

```bash
cd packages/contracts
npx hardhat run scripts/deploy.ts --network fhenixTestnet
npx hardhat run scripts/seedDemoPayroll.ts --network fhenixTestnet
cp deployments/env-snippet.txt ../../apps/web/.env.local
```

## Vercel environment variables (Production)

After deploy, set in [Vercel Project Settings → Environment Variables](https://vercel.com):

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_CHAIN_ID` | `8008135` |
| `NEXT_PUBLIC_RPC_URL` | `https://get-helium.fhenix.zone` |
| `NEXT_PUBLIC_PAYSHIELD_FACTORY_ADDRESS` | *(from `deployments/latest.json`)* |
| `NEXT_PUBLIC_MOCK_USDC_ADDRESS` | *(from `deployments/latest.json`)* |
| `NEXT_PUBLIC_ACCESS_MANAGER_ADDRESS` | *(from `deployments/latest.json`)* |
| `COFHE_GATEWAY_URL` | `https://gateway.helium.fhenix.zone` |

Redeploy the frontend after updating env vars.

## RPC endpoints

If `api.helium.fhenix.zone` fails, try `https://get-helium.fhenix.zone` (set `FHENIX_TESTNET_RPC_URL` in `.env.local`).
