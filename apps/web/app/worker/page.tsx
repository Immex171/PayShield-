'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Address } from 'viem';
import { WorkerClaimCard } from '../../components/worker/WorkerClaimCard';
import { StealthPayoutCard } from '../../components/worker/StealthPayoutCard';
import { PrivateSalaryView } from '../../components/worker/PrivateSalaryView';
import { WalletConnectButton } from '../../components/shared/WalletConnectButton';

export default function WorkerDashboard() {
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

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl mb-4">👷</div>
          <h2 className="text-2xl font-bold font-display">Worker Portal</h2>
          <p className="text-white/50 text-sm">
            Connect your wallet to view your encrypted salary and claim your payment.
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
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-display">Worker Dashboard</h1>
          <p className="text-white/40 text-sm mt-1 font-mono">
            {address?.slice(0, 12)}...{address?.slice(-8)}
          </p>
        </div>

        {/* Privacy banner */}
        <div className="glass rounded-xl p-4 border border-cyan-400/10 flex items-start gap-3">
          <span className="text-cyan-400 text-lg">🔐</span>
          <div className="text-sm">
            <p className="text-white font-medium">Your salary is private</p>
            <p className="text-white/40 mt-0.5">
              Encrypted with Fhenix CoFHE. Only you can decrypt your salary value — not your
              employer, not block explorers.
            </p>
          </div>
        </div>

        {/* Payroll address input */}
        {!payrollAddress ? (
          <div className="glass rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-white">Enter Payroll Contract</h3>
            <p className="text-sm text-white/40">
              Enter the payroll contract address provided by your employer.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="0x... payroll contract address"
                value={payrollInput}
                onChange={(e) => setPayrollInput(e.target.value)}
                className="input-field flex-1 font-mono text-sm"
              />
              <button
                onClick={() => setPayrollAddress(payrollInput as Address)}
                disabled={!payrollInput.startsWith('0x')}
                className="btn-primary text-sm px-5"
              >
                Connect
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

            <PrivateSalaryView payrollAddress={payrollAddress} />
            <StealthPayoutCard payrollAddress={payrollAddress} />
            <WorkerClaimCard payrollAddress={payrollAddress} />
          </div>
        )}
      </div>
    </div>
  );
}
