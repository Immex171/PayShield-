.PHONY: install dev test deploy seed clean build

# ─── Setup ───────────────────────────────────────────────────────────────────

install:
	pnpm install

# ─── Development ─────────────────────────────────────────────────────────────

dev:
	pnpm --filter @payshield/web dev

node:
	cd packages/contracts && npx hardhat node:fhenix

# ─── Contracts ───────────────────────────────────────────────────────────────

compile:
	cd packages/contracts && npx hardhat compile

test:
	cd packages/contracts && npx hardhat test

test-gas:
	cd packages/contracts && REPORT_GAS=true npx hardhat test

test-file:
	cd packages/contracts && npx hardhat test test/$(FILE)

deploy-local:
	cd packages/contracts && npx hardhat run scripts/deploy.ts --network localfhenix

deploy-testnet:
	cd packages/contracts && npx hardhat run scripts/deploy.ts --network fhenixTestnet

deploy-arbitrum-sepolia:
	cd packages/contracts && npx hardhat run scripts/deploy.ts --network arbitrumSepolia
	cp packages/contracts/deployments/env-snippet.txt apps/web/.env.local
	@echo ""
	@echo "✓ Deployed to Arbitrum Sepolia"
	@echo "✓ apps/web/.env.local updated"

seed:
	cd packages/contracts && npx hardhat run scripts/seedDemoPayroll.ts --network localfhenix

setup-integration:
	cd packages/contracts && npx hardhat run scripts/setupIntegration.ts --network localhost

seed-testnet:
	cd packages/contracts && npx hardhat run scripts/seedDemoPayroll.ts --network fhenixHelium

# ─── Full local demo setup ───────────────────────────────────────────────────

demo-setup: deploy-local setup-integration
	cp packages/contracts/deployments/env-snippet.txt apps/web/.env.local
	@echo ""
	@echo "✓ Contracts deployed and seeded"
	@echo "✓ .env.local written"
	@echo ""
	@echo "Run 'make dev' to start the frontend"

# ─── Build ───────────────────────────────────────────────────────────────────

build:
	pnpm build

# ─── Clean ───────────────────────────────────────────────────────────────────

clean:
	rm -rf packages/contracts/artifacts
	rm -rf packages/contracts/cache
	rm -rf packages/contracts/deployments
	rm -rf apps/web/.next
	rm -rf apps/web/.env.local

clean-all: clean
	rm -rf node_modules
	find . -name node_modules -type d -prune -exec rm -rf {} +

# ─── Help ────────────────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "PayShield — Private Payroll for Public Blockchains"
	@echo ""
	@echo "  make install        Install all dependencies"
	@echo "  make node           Start Fhenix local node (requires Docker)"
	@echo "  make demo-setup     Deploy + seed contracts, write .env.local"
	@echo "  make dev            Start Next.js frontend"
	@echo "  make test           Run contract tests"
	@echo "  make test-gas       Run tests with gas reporting"
	@echo "  make compile        Compile Solidity contracts"
	@echo "  make deploy-local   Deploy to local Fhenix node"
	@echo "  make deploy-testnet Deploy to Fhenix Helium testnet"
	@echo "  make deploy-arbitrum-sepolia Deploy to Arbitrum Sepolia + update .env.local"
	@echo "  make seed           Seed demo payroll (local)"
	@echo "  make build          Build all packages"
	@echo "  make clean          Remove build artifacts"
	@echo ""
