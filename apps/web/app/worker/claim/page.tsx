'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Address } from 'viem';
import { Suspense } from 'react';
import { WorkerClaimCard } from '../../../components/worker/WorkerClaimCard';
import { PrivateSalaryView } from '../../../components/worker/PrivateSalaryView';
import { WalletConnectButton } from '../../../components/shared/WalletConnectButton';
import Link from 'next/link';

function ClaimContent() {
  const { isConnected } = useAccount();
  const searchParams = useSearchParams();
  const router = useRouter();
  const payrollAddress = searchParams.get('payroll') as Address | null;

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl mb-4">💸</div>
          <h2 className="text-2xl font-bold font-display">Claim Your Salary</h2>
          <p className="text-white/50 text-sm">Connect your wallet to claim your encrypted salary payment.</p>
          <div className="flex justify-center mt-4">
            <WalletConnectButton />
          </div>
        </div>
      </div>
    );
  }

  if (!payrollAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-sm text-center space-y-4">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-xl font-bold font-display">No Payroll Specified</h2>
          <p className="text-white/50 text-sm">
            This page requires a payroll contract address. Use the link provided by your employer,
            or navigate via the Worker Portal.
          </p>
          <Link href="/worker" className="btn-primary inline-block mt-2">
            Go to Worker Portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-white/30 hover:text-white/60 transition-colors text-sm"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold font-display">Claim Salary</h1>
        </div>

        <div className="text-xs text-white/30 font-mono bg-white/5 rounded-lg px-3 py-2">
          Payroll: {payrollAddress}
        </div>

        <PrivateSalaryView payrollAddress={payrollAddress} />
        <WorkerClaimCard payrollAddress={payrollAddress} />
      </div>
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    }>
      <ClaimContent />
    </Suspense>
  );
}
