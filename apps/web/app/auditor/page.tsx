'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Address, formatUnits } from 'viem';
import { useReadContract } from 'wagmi';
import { PAYSHIELD_PAYROLL_ABI, PAYSHIELD_VAULT_ABI } from '@payshield/sdk';
import { AuditorAccessCard } from '../../components/auditor/AuditorAccessCard';
import { WalletConnectButton } from '../../components/shared/WalletConnectButton';

export default function AuditorDashboard() {
  const { address, isConnected } = useAccount();
  const [payrollInput, setPayrollInput] = useState(
    process.env.NEXT_PUBLIC_DEMO_PAYROLL_ADDRESS ?? ''
  );
  const [payrollAddress, setPayrollAddress] = useState<Address | null>(null);

  useEffect(() => {
    const demo = process.env.NEXT_PUBLIC_DEMO_PAYROLL_ADDRESS;
    if (demo?.startsWith('0x')) {
      setPayrollAddress(demo as Address);
    }
  }, []);

  const { data: isAuditor } = useReadContract({
    address: payrollAddress ?? undefined,
    abi: PAYSHIELD_PAYROLL_ABI,
    functionName: 'hasAuditorAccess',
    args: address ? [address] : undefined,
    query: { enabled: !!payrollAddress && !!address },
  });

  const { data: workerCount } = useReadContract({
    address: payrollAddress ?? undefined,
    abi: PAYSHIELD_PAYROLL_ABI,
    functionName: 'workerCount',
    query: { enabled: !!payrollAddress && !!isAuditor },
  });

  const { data: vaultAddress } = useReadContract({
    address: payrollAddress ?? undefined,
    abi: PAYSHIELD_PAYROLL_ABI,
    functionName: 'vaultAddress',
    query: { enabled: !!payrollAddress && !!isAuditor },
  });

  const { data: vaultBalance } = useReadContract({
    address: vaultAddress as Address | undefined,
    abi: PAYSHIELD_VAULT_ABI,
    functionName: 'getBalance',
    query: { enabled: !!vaultAddress && !!isAuditor },
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold font-display">Auditor Portal</h2>
          <p className="text-white/50 text-sm">
            Connect your wallet to verify payroll integrity without accessing individual salary data.
          </p>
          <div className="flex justify-center mt-4">
            <WalletConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-display">Auditor Dashboard</h1>
          <p className="text-white/50 text-sm mt-1">
            Verify payroll health without exposing individual compensation data.
          </p>
        </div>

        {/* Privacy model explanation */}
        <div className="glass rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
            What Auditors Can See
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Worker Count', access: true },
              { label: 'Vault Balance', access: true },
              { label: 'Claim History', access: true },
              { label: 'Contract Activity', access: true },
              { label: 'Individual Salaries', access: false },
              { label: 'Employee Identities', access: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className={item.access ? 'text-emerald-400' : 'text-red-400/60'}>
                  {item.access ? '✓' : '✗'}
                </span>
                <span className={item.access ? 'text-white/60' : 'text-white/25 line-through'}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Payroll address input */}
        {!payrollAddress ? (
          <div className="glass rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-white">Enter Payroll Address</h3>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="0x... payroll contract"
                value={payrollInput}
                onChange={(e) => setPayrollInput(e.target.value)}
                className="input-field flex-1 font-mono text-sm"
              />
              <button
                onClick={() => setPayrollAddress(payrollInput as Address)}
                disabled={!payrollInput.startsWith('0x')}
                className="btn-primary text-sm px-5"
              >
                View
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/40 font-mono">
                {payrollAddress.slice(0, 12)}...{payrollAddress.slice(-8)}
              </p>
              <button
                onClick={() => { setPayrollAddress(null); setPayrollInput(''); }}
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                Change
              </button>
            </div>

            <AuditorAccessCard payrollAddress={payrollAddress} isCompanyAdmin={false} />

            {isAuditor && (
              <div className="glass rounded-xl p-6 space-y-4">
                <h3 className="font-semibold text-white">Payroll Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-strong rounded-lg p-4">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Workers</p>
                    <p className="text-2xl font-bold">{workerCount ? String(workerCount) : '—'}</p>
                  </div>
                  <div className="glass-strong rounded-lg p-4">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Vault</p>
                    <p className="text-2xl font-bold text-cyan-400">
                      {vaultBalance ? `$${parseFloat(formatUnits(vaultBalance as bigint, 6)).toLocaleString()}` : '—'}
                    </p>
                  </div>
                </div>
                <div className="text-center py-4 border border-dashed border-white/10 rounded-xl">
                  <span className="salary-redacted text-2xl font-mono">●●●●●</span>
                  <p className="text-xs text-white/30 mt-2">
                    Individual salary amounts remain encrypted
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
