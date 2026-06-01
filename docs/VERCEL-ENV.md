# Vercel environment variables (current production)

Update these in **Vercel → Project → Settings → Environment Variables** for Production (and Preview if needed).

## Arbitrum Sepolia (deployed 2026-06-01 — includes multi-period, stealth payout, async claim)

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_PAYSHIELD_FACTORY_ADDRESS` | `0x177b3C5Dd27ec54b911cea571f143ACd939DC2fA` |
| `NEXT_PUBLIC_MOCK_USDC_ADDRESS` | `0xA1173B4FCd98271426b904cA69dCcBe7C1098952` |
| `NEXT_PUBLIC_ACCESS_MANAGER_ADDRESS` | `0x1a85f38bd6eD8caA204e95E528369De3936e2c00` |
| `NEXT_PUBLIC_DEMO_PAYROLL_ADDRESS` | `0xDDdF755427e50317120cAfEF136aeDc98bf54a7b` |
| `NEXT_PUBLIC_CHAIN_ID` | `421614` |
| `NEXT_PUBLIC_RPC_URL` | `https://sepolia-rollup.arbitrum.io/rpc` |
| `COFHE_GATEWAY_URL` | `https://gateway.helium.fhenix.zone` |

**Do not** add private keys to Vercel.

After saving, trigger **Redeploy** on the latest commit.

## Fhenix Helium (when you deploy there)

See [DEPLOY-FHENIX.md](./DEPLOY-FHENIX.md) and use chain `8008135` with addresses from `packages/contracts/deployments/latest.json`.
