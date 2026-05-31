'use client';

import { useState } from 'react';
import Link from 'next/link';

interface DemoStep {
  id: number;
  role: 'company' | 'worker' | 'auditor' | 'attacker';
  title: string;
  description: string;
  detail: string;
  code?: string;
  cta?: { label: string; href: string };
  privacyNote?: string;
}

const DEMO_STEPS: DemoStep[] = [
  {
    id: 1,
    role: 'company',
    title: 'Company Deploys Payroll',
    description:
      'The company admin connects their wallet and calls createPayroll() on the factory contract.',
    detail:
      'PayShieldFactory deploys a PayShieldPayroll + PayShieldVault + AccessManager atomically. The admin is registered as COMPANY_ADMIN.',
    code: `// Factory deploys 3 contracts atomically
PayShieldFactory.createPayroll("Acme Corp", mUSDC_ADDRESS)
// → PayShieldPayroll (worker registry + FHE storage)
// → PayShieldVault (USDC custody)
// → AccessManager (role control)`,
    cta: { label: 'Create Payroll →', href: '/company/create-payroll' },
  },
  {
    id: 2,
    role: 'company',
    title: 'Salary Encrypted Client-Side',
    description:
      'The company adds a worker. Before the TX is signed, the salary amount is encrypted locally using the Fhenix CoFHE SDK.',
    detail:
      'cofheClient.encrypt_uint128(5000_000000n) produces an InEuint128 ciphertext. Only the ciphertext is broadcast — the plaintext never touches the mempool.',
    code: `// Client-side, before signing
const encrypted = await cofheClient.encrypt_uint128(5000_000000n);
// → { ctHash: "0xabc...", securityZone: 0 }

// TX payload — salary is ciphertext, not 5000
payroll.addWorker(worker, employeeIdHash, encryptedSalaryBytes)`,
    privacyNote:
      'The salary value 5000 is never transmitted or stored. A mempool observer only sees encrypted bytes.',
    cta: { label: 'Add Workers →', href: '/company' },
  },
  {
    id: 3,
    role: 'company',
    title: 'Contract Stores euint128',
    description:
      'Fhenix validates the encrypted input and stores the salary as a euint128 — an opaque on-chain ciphertext.',
    detail:
      'FHE.asEuint128(inSalary) validates the homomorphic proof and stores the encrypted value. FHE.allow() gates which addresses can later decrypt.',
    code: `// PayShieldPayroll.sol
euint128 encSalary = FHE.asEuint128(inSalary);
FHE.allow(encSalary, worker);      // only worker can decrypt
FHE.allow(encSalary, address(this)); // contract can compute

workers[workerAddr].encryptedSalary = encSalary;`,
    privacyNote:
      'Etherscan / block explorers only see 0x... ciphertext. There is no plaintext salary in any transaction, event, or storage slot.',
  },
  {
    id: 4,
    role: 'company',
    title: 'Vault Funded with mUSDC',
    description:
      'The company deposits USDC into the vault. The vault holds funds and releases them only when the payroll contract authorizes.',
    detail:
      'Two-step: approve mUSDC spend → call fundPayroll(amount). The vault tracks balances and ensures solvency before any claim.',
    code: `mUSDC.approve(vaultAddress, 50_000e6);
payroll.fundPayroll(50_000e6);
// Vault now holds 50,000 mUSDC`,
    cta: { label: 'Fund Vault →', href: '/company' },
  },
  {
    id: 5,
    role: 'worker',
    title: 'Worker Views Encrypted Salary',
    description:
      'The worker connects their wallet. They can trigger a sealed decryption — their salary is re-encrypted under their public key and unsealed locally.',
    detail:
      'FHE.sealOutput(encryptedSalary, permission) re-encrypts the value for the caller. The worker unseals it in their browser. The plaintext never leaves their device.',
    code: `// Worker calls getSealedSalary(permission)
const sealedResult = await payroll.getSealedSalary(permission);

// Worker unseals locally with cofheClient
const salary = await cofheClient.unseal(sealedResult);
// → 5000.00 — visible only to the worker`,
    privacyNote: 'No server, no relay, no database sees this value.',
    cta: { label: 'Worker View →', href: '/worker' },
  },
  {
    id: 6,
    role: 'worker',
    title: 'Worker Claims Salary',
    description:
      'The worker signs a claimSalary() transaction. The contract uses FHE.decrypt() inside the claim logic to validate and release the correct amount.',
    detail:
      'claimSalary() calls FHE.decrypt() via threshold decryption. The network validators decrypt inside the computation without exposing the value to any single party.',
    code: `// PayShieldPayroll.sol
function claimSalary() external onlyWorker {
  uint128 salaryAmount = FHE.decrypt(workers[msg.sender].encryptedSalary);
  vault.releaseSalary(msg.sender, salaryAmount);
  emit SalaryClaimed(msg.sender, block.timestamp);
  // note: salaryAmount NOT emitted
}`,
    privacyNote: 'The event log does not include the salary amount.',
  },
  {
    id: 7,
    role: 'auditor',
    title: 'Auditor Views Aggregate Data',
    description:
      'A granted auditor can verify worker count and vault solvency — but cannot read individual salaries.',
    detail:
      'FHE access control means the encrypted salary ciphertexts are simply unreadable without FHE.allow(). The auditor can verify the payroll is funded and workers are active.',
    code: `// Auditor can read
payroll.getWorkerCount()   // → 3
payroll.getVaultBalance()  // → 15000.00 USDC

// Auditor CANNOT read
payroll.getEncryptedSalary(workerAddr)
// → 0x[opaque ciphertext] — cannot decrypt without permission`,
    cta: { label: 'Auditor View →', href: '/auditor' },
  },
  {
    id: 8,
    role: 'attacker',
    title: 'Attacker Gets Nothing',
    description:
      'An attacker inspecting the chain, mempool, or contract state sees only ciphertext. No salary data is accessible.',
    detail:
      'There is no oracle, no IPFS link, no event log with salary amounts. The attacker would need to break FHE (computationally infeasible) to recover any salary value.',
    privacyNote:
      '✓ Mempool: encrypted bytes only. ✓ Block explorer: euint128 ciphertext. ✓ Events: no salary amounts. ✓ State: opaque FHE ciphertext.',
    code: `// What an attacker sees on etherscan
Transaction input:
  addWorker(0xWorker, 0xEmployeeHash, 0xABCDEF...)
                                       ^^^^^^^^
                         encrypted salary — unreadable without FHE key`,
  },
];

const ROLE_COLORS = {
  company: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5',
  worker: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  auditor: 'text-violet-400 border-violet-400/30 bg-violet-400/5',
  attacker: 'text-red-400 border-red-400/30 bg-red-400/5',
};

const ROLE_LABELS = {
  company: '🏢 Company Admin',
  worker: '👷 Worker',
  auditor: '🔍 Auditor',
  attacker: '🕵️ Attacker',
};

export default function DemoPage() {
  const [activeStep, setActiveStep] = useState(0);
  const step = DEMO_STEPS[activeStep];

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="badge-encrypted text-xs px-3 py-1">
            🔐 Interactive Demo
          </span>
          <h1 className="text-4xl font-bold font-display">
            PayShield <span className="gradient-text">in 8 Steps</span>
          </h1>
          <p className="text-white/50 max-w-xl mx-auto text-sm">
            Walk through a complete payroll cycle — from deployment to claim — and see how FHE keeps
            salary data private at every step.
          </p>
        </div>

        {/* Step navigator */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {DEMO_STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveStep(i)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                i === activeStep
                  ? ROLE_COLORS[s.role]
                  : 'border-white/10 text-white/30 hover:text-white/50'
              }`}
            >
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs">
                {s.id}
              </span>
              <span className="hidden md:inline whitespace-nowrap">{s.title.split(' ').slice(0, 3).join(' ')}</span>
            </button>
          ))}
        </div>

        {/* Main step card */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-7 space-y-5">
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full border ${ROLE_COLORS[step.role]}`}
              >
                {ROLE_LABELS[step.role]}
              </span>
              <span className="text-xs text-white/30">Step {step.id} of {DEMO_STEPS.length}</span>
            </div>

            <div>
              <h2 className="text-xl font-bold font-display">{step.title}</h2>
              <p className="text-white/60 text-sm mt-2 leading-relaxed">{step.description}</p>
            </div>

            <div className="glass-strong rounded-xl p-4">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">What Happens</p>
              <p className="text-sm text-white/70 leading-relaxed">{step.detail}</p>
            </div>

            {step.privacyNote && (
              <div className="rounded-lg bg-cyan-400/5 border border-cyan-400/20 p-3">
                <p className="text-xs text-cyan-400">🔐 {step.privacyNote}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                disabled={activeStep === 0}
                className="btn-ghost text-sm px-4 py-2 disabled:opacity-30"
              >
                ← Prev
              </button>
              {step.cta ? (
                <Link href={step.cta.href} className="btn-primary text-sm flex-1 text-center">
                  {step.cta.label}
                </Link>
              ) : (
                <button
                  onClick={() => setActiveStep(Math.min(DEMO_STEPS.length - 1, activeStep + 1))}
                  disabled={activeStep === DEMO_STEPS.length - 1}
                  className="btn-primary text-sm flex-1 disabled:opacity-30"
                >
                  Next Step →
                </button>
              )}
            </div>
          </div>

          {/* Code panel */}
          <div className="glass rounded-2xl p-6 flex flex-col">
            <p className="text-xs text-white/30 uppercase tracking-wider mb-4">Code Reference</p>
            {step.code ? (
              <pre className="text-xs text-white/70 font-mono leading-relaxed overflow-auto flex-1 bg-black/20 rounded-xl p-4">
                {step.code}
              </pre>
            ) : (
              <div className="flex-1 flex items-center justify-center text-white/20 text-sm">
                No code sample for this step
              </div>
            )}
          </div>
        </div>

        {/* Quick start */}
        <div className="glass rounded-2xl p-7 border border-cyan-400/10">
          <h3 className="font-semibold text-white mb-4">🚀 Quick Start (Local)</h3>
          <pre className="text-xs text-white/60 font-mono space-y-1 bg-black/20 rounded-xl p-4 overflow-x-auto">
{`# 1. Clone and install
git clone https://github.com/your-org/payshield
cd payshield && pnpm install

# 2. Start Fhenix local node (Docker required)
cd packages/contracts && npx hardhat node:fhenix

# 3. Deploy contracts
npx hardhat run scripts/deploy.ts --network localfhenix

# 4. Seed demo payroll
npx hardhat run scripts/seedDemoPayroll.ts --network localfhenix

# 5. Start frontend
cd apps/web && pnpm dev
# → http://localhost:3000`}
          </pre>
        </div>
      </div>
    </div>
  );
}
