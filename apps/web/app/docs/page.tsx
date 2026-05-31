'use client';

import Link from 'next/link';

const SECTIONS = [
  {
    title: 'Architecture',
    description: 'Smart contract structure, data flow, and FHE integration overview.',
    icon: '🏗️',
    href: '#architecture',
  },
  {
    title: 'Privacy Model',
    description: 'How salary data stays private at every layer: mempool, chain state, events.',
    icon: '🔐',
    href: '#privacy',
  },
  {
    title: 'Fhenix Integration',
    description: 'CoFHE usage patterns: euint128, FHE.allow(), sealOutput, decrypt.',
    icon: '⚙️',
    href: '#fhenix',
  },
  {
    title: 'Contracts',
    description: 'API reference for PayShieldFactory, Payroll, Vault, and AccessManager.',
    icon: '📄',
    href: '#contracts',
  },
  {
    title: 'Testing',
    description: 'Running Hardhat tests with CoFHE mock environment.',
    icon: '🧪',
    href: '#testing',
  },
  {
    title: 'Roadmap',
    description: 'Confidential tokens, stealth addresses, recurring payroll automation.',
    icon: '🗺️',
    href: '#roadmap',
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        <div>
          <h1 className="text-4xl font-bold font-display">Documentation</h1>
          <p className="text-white/50 mt-2">
            Technical reference for PayShield — the confidential payroll dApp built on Fhenix CoFHE.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {SECTIONS.map((s) => (
            <a
              key={s.title}
              href={s.href}
              className="glass rounded-xl p-5 hover:border-cyan-400/20 border border-transparent transition-colors group"
            >
              <div className="text-2xl mb-3">{s.icon}</div>
              <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                {s.title}
              </h3>
              <p className="text-sm text-white/40 mt-1">{s.description}</p>
            </a>
          ))}
        </div>

        {/* Architecture section */}
        <section id="architecture" className="space-y-4 scroll-mt-24">
          <h2 className="text-2xl font-bold font-display border-b border-white/10 pb-3">
            🏗️ Architecture
          </h2>
          <div className="glass rounded-xl p-6 space-y-4 text-sm text-white/70 leading-relaxed">
            <p>
              PayShield is a monorepo with three layers: smart contracts (Solidity/Hardhat), an SDK
              helper package, and a Next.js frontend.
            </p>
            <div className="glass-strong rounded-xl p-4 font-mono text-xs text-white/50 space-y-1">
              <p>PayShieldFactory → creates per-company payroll system</p>
              <p>  ├── PayShieldPayroll  → worker registry, euint128 salary storage</p>
              <p>  ├── PayShieldVault    → USDC custody, salary release</p>
              <p>  └── AccessManager    → ADMIN / WORKER / AUDITOR roles</p>
            </div>
            <p>
              The factory deploys all three atomically via a single transaction, ensuring they are
              always correctly linked.
            </p>
          </div>
        </section>

        {/* Privacy section */}
        <section id="privacy" className="space-y-4 scroll-mt-24">
          <h2 className="text-2xl font-bold font-display border-b border-white/10 pb-3">
            🔐 Privacy Model
          </h2>
          <div className="glass rounded-xl p-6 space-y-4 text-sm text-white/70 leading-relaxed">
            {[
              ['Mempool', 'Salary is encrypted client-side before the TX is broadcast. Nodes only see ciphertext.'],
              ['Contract State', 'Stored as euint128 — an FHE ciphertext. No plaintext in any storage slot.'],
              ['Event Logs', 'SalaryClaimed events do not include amount. WorkerAdded omits salary.'],
              ['Block Explorers', 'No salary value visible to etherscan/blockscout watchers.'],
              ['Auditors', 'Can verify worker count and vault balance but not individual salaries.'],
            ].map(([layer, desc]) => (
              <div key={layer as string} className="flex gap-3 items-start">
                <span className="text-cyan-400 font-mono text-xs w-28 flex-shrink-0 mt-0.5">{layer}</span>
                <span>{desc as string}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Fhenix integration */}
        <section id="fhenix" className="space-y-4 scroll-mt-24">
          <h2 className="text-2xl font-bold font-display border-b border-white/10 pb-3">
            ⚙️ Fhenix CoFHE Integration
          </h2>
          <div className="glass rounded-xl p-6 space-y-5 text-sm">
            <p className="text-white/70">
              PayShield uses Fhenix CoFHE (Coprocessor Fully Homomorphic Encryption) for encrypted
              salary storage. Key FHE patterns used:
            </p>
            {[
              {
                name: 'FHE.asEuint128(inSalary)',
                desc: 'Converts an InEuint128 encrypted input into an on-chain euint128 ciphertext after verifying the homomorphic proof.',
              },
              {
                name: 'FHE.allow(value, address)',
                desc: 'Gates which addresses can later decrypt or compute over the ciphertext.',
              },
              {
                name: 'FHE.sealOutput(value, permission)',
                desc: 'Re-encrypts the value under the caller\'s public key for client-side unsealing.',
              },
              {
                name: 'FHE.decrypt(value)',
                desc: 'Threshold decryption by Fhenix validators — used inside claim logic.',
              },
            ].map((item) => (
              <div key={item.name} className="glass-strong rounded-lg p-4">
                <code className="text-cyan-400 text-xs">{item.name}</code>
                <p className="text-white/50 text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testing */}
        <section id="testing" className="space-y-4 scroll-mt-24">
          <h2 className="text-2xl font-bold font-display border-b border-white/10 pb-3">
            🧪 Testing
          </h2>
          <div className="glass rounded-xl p-6 text-sm text-white/70 space-y-3">
            <p>Tests use the CoFHE Hardhat plugin which spins up a local FHE environment:</p>
            <pre className="bg-black/20 rounded-xl p-4 text-xs font-mono text-white/50 overflow-x-auto">
{`cd packages/contracts

# Run all tests
npx hardhat test

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Target a single file
npx hardhat test test/PayShieldPayroll.test.ts`}
            </pre>
            <p className="text-white/40">
              The mock environment encrypts values using a local key so that tests can assert on
              decrypted values without running a full Fhenix node.
            </p>
          </div>
        </section>

        {/* Roadmap */}
        <section id="roadmap" className="space-y-4 scroll-mt-24">
          <h2 className="text-2xl font-bold font-display border-b border-white/10 pb-3">
            🗺️ Roadmap
          </h2>
          <div className="glass rounded-xl p-6 space-y-3">
            {[
              ['v1 (MVP)', 'Encrypted salary storage, worker claim, auditor access — built'],
              ['v2', 'Confidential token payouts (Privara / FHE-native USDC)'],
              ['v3', 'Stealth worker addresses — employer never knows which wallet belongs to which person'],
              ['v4', 'Recurring automated payroll with encrypted scheduling'],
              ['v5', 'Multi-sig company admin, DAO governance for salary updates'],
              ['v6', 'ZK proof of payment for contractor invoicing'],
            ].map(([v, desc]) => (
              <div key={v as string} className="flex gap-3 items-start text-sm">
                <span className="font-mono text-xs text-white/30 w-20 flex-shrink-0 mt-0.5">{v}</span>
                <span className="text-white/60">{desc as string}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="text-center py-4">
          <Link href="/demo" className="btn-primary inline-flex items-center gap-2">
            Try the Live Demo →
          </Link>
        </div>
      </div>
    </div>
  );
}
