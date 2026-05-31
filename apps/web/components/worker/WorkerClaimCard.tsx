'use client';

import { Address, formatUnits } from 'viem';
import { useClaimSalary } from '../../hooks/useClaimSalary';
import { useWorkerPayroll } from '../../hooks/useWorkerPayroll';

interface WorkerClaimCardProps {
  payrollAddress: Address;
}

export function WorkerClaimCard({ payrollAddress }: WorkerClaimCardProps) {
  const { claimSalary, isPending, claimStep, isSuccess, error, reset } = useClaimSalary(payrollAddress);
  const { isWorker, workerInfo, isLoading } = useWorkerPayroll(payrollAddress);

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-6 animate-pulse">
        <div className="h-4 bg-white/5 rounded w-1/2 mb-3" />
        <div className="h-8 bg-white/5 rounded w-3/4" />
      </div>
    );
  }

  if (!isWorker) {
    return (
      <div className="glass rounded-xl p-6 border border-yellow-500/20">
        <p className="text-yellow-400 text-sm font-semibold">Not Registered</p>
        <p className="text-white/40 text-sm mt-1">
          Your wallet is not registered as a worker in this payroll contract.
          Contact your employer to add your address.
        </p>
      </div>
    );
  }

  const info = workerInfo as any;

  if (isSuccess) {
    return (
      <div className="glass rounded-xl p-6 border border-emerald-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg">
            ✓
          </div>
          <div>
            <p className="font-semibold text-emerald-400">Salary Claimed</p>
            <p className="text-sm text-white/40">Funds transferred to your wallet</p>
          </div>
        </div>
        <button onClick={reset} className="btn-ghost text-xs">
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">Your Payroll</h3>
        <span className={info?.isActive ? 'badge-active' : 'badge-warning'}>
          {info?.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="glass-strong rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40 uppercase tracking-wider">Monthly Salary</span>
          <span className="salary-redacted encrypted-pulse text-lg font-mono">●●●●●</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40 uppercase tracking-wider">Total Claimed</span>
          <span className="font-mono text-white">
            {info?.claimedAmount ? `$${formatUnits(info.claimedAmount as bigint, 6)}` : '$0.00'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40 uppercase tracking-wider">Last Claim</span>
          <span className="text-sm text-white/60">
            {info?.lastClaimTime && info.lastClaimTime > 0n
              ? new Date(Number(info.lastClaimTime) * 1000).toLocaleDateString()
              : 'Never'}
          </span>
        </div>
      </div>

      <p className="text-xs text-cyan-400/70 bg-cyan-400/5 border border-cyan-400/10 rounded-lg p-3">
        🔐 Your salary is stored as an encrypted value on-chain. Even the employer cannot read it
        without your FHE decryption key.
      </p>

      {claimStep !== 'idle' && claimStep !== 'done' && (
        <div className="text-xs text-cyan-400 flex items-center gap-2">
          <div className="w-3 h-3 border border-t-cyan-400 border-white/20 rounded-full animate-spin" />
          {claimStep === 'preparing' && 'Preparing claim...'}
          {claimStep === 'signing' && 'Sign transaction in wallet...'}
          {claimStep === 'confirming' && 'Waiting for confirmation...'}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
          {error}
        </p>
      )}

      <button
        onClick={claimSalary}
        disabled={isPending || !info?.isActive}
        className="btn-primary w-full"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border border-t-white border-white/30 rounded-full animate-spin" />
            Processing Claim...
          </span>
        ) : (
          'Claim Monthly Salary'
        )}
      </button>

      {!info?.isActive && (
        <p className="text-xs text-center text-white/30">
          Your worker status is currently inactive. Contact your employer.
        </p>
      )}
    </div>
  );
}
