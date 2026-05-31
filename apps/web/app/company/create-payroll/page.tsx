'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useCompany } from '../../../hooks/useCompany';
import { useEnsureChain } from '../../../hooks/useEnsureChain';
import { WalletConnectButton } from '../../../components/shared/WalletConnectButton';

export default function CreatePayrollPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { createPayroll, isPending, isSuccess, error } = useCompany();
  const { isWrongChain, targetChainName } = useEnsureChain();
  const [companyName, setCompanyName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPayroll();
      setSubmitted(true);
    } catch {}
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold font-display">Connect Wallet First</h2>
          <WalletConnectButton />
        </div>
      </div>
    );
  }

  if (isSuccess && submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full glass rounded-2xl p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-3xl mx-auto">
            ✓
          </div>
          <h2 className="text-2xl font-bold font-display">Payroll Created!</h2>
          <p className="text-white/50 text-sm">
            Your PayShield payroll contract has been deployed on Fhenix. You can now add workers
            and fund the vault.
          </p>
          <button onClick={() => router.push('/company')} className="btn-primary w-full">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 flex items-start justify-center">
      <div className="max-w-lg w-full space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-display">Create Payroll</h1>
          <p className="text-white/50 text-sm mt-2">
            Deploy a new PayShield payroll contract. This creates a dedicated vault and access
            manager for your company.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-7 space-y-6">
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
              Company Name <span className="normal-case text-white/30">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Acme Corp / DAO Name / Team"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="input-field w-full"
            />
            <p className="text-xs text-white/30 mt-1">
              Local label only — not sent on-chain. The contract links payroll to your wallet address.
            </p>
          </div>

          {/* What gets deployed */}
          <div className="glass-strong rounded-xl p-4 space-y-2 text-sm">
            <p className="text-xs text-white/50 uppercase tracking-wider mb-3">What gets deployed</p>
            {[
              ['PayShieldPayroll.sol', 'Worker registry + encrypted salary storage'],
              ['PayShieldVault.sol', 'USDC custody, salary release'],
              ['AccessManager.sol', 'Role-based FHE access control'],
            ].map(([name, desc]) => (
              <div key={name} className="flex items-start gap-3">
                <span className="text-emerald-400 mt-0.5">✓</span>
                <div>
                  <code className="text-white/70 text-xs bg-white/5 px-1.5 py-0.5 rounded">{name}</code>
                  <span className="text-white/30 text-xs ml-2">{desc}</span>
                </div>
              </div>
            ))}
          </div>

          {isWrongChain && (
            <p className="text-sm text-amber-400 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
              Switch MetaMask to {targetChainName} before deploying. Mainnet ETH will not work here.
            </p>
          )}

          {error && (
            <p className="text-sm text-red-400 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
              {error}
            </p>
          )}

          <button type="submit" disabled={isPending || isWrongChain} className="btn-primary w-full">
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border border-t-white border-white/30 rounded-full animate-spin" />
                Deploying Contracts...
              </span>
            ) : (
              'Deploy Payroll Contracts'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
