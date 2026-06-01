'use client';

import { useEffect } from 'react';
import { Address } from 'viem';
import { usePayPeriod } from '../../hooks/usePayPeriod';

interface PayPeriodCardProps {
  payrollAddress: Address;
}

export function PayPeriodCard({ payrollAddress }: PayPeriodCardProps) {
  const {
    currentPeriodId,
    periodStartedAt,
    advancePeriod,
    isAdvancing,
    isAdvanceConfirmed,
    error,
    refetch,
  } = usePayPeriod(payrollAddress);

  const periodStartDate =
    periodStartedAt && periodStartedAt > 0n
      ? new Date(Number(periodStartedAt) * 1000).toLocaleDateString()
      : '—';

  useEffect(() => {
    if (isAdvanceConfirmed) refetch();
  }, [isAdvanceConfirmed, refetch]);

  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">Pay Period</h3>
        <span className="badge-encrypted text-xs">Multi-period</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-strong rounded-lg p-4">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Current Period</p>
          <p className="text-2xl font-bold font-mono text-cyan-400">
            {currentPeriodId !== undefined ? `#${currentPeriodId.toString()}` : '—'}
          </p>
        </div>
        <div className="glass-strong rounded-lg p-4">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Period Started</p>
          <p className="text-sm text-white/70">{periodStartDate}</p>
        </div>
      </div>

      <p className="text-xs text-white/40">
        Advance the period when a new pay cycle begins. Workers can claim once per period.
        Salaries remain encrypted — only claim eligibility resets.
      </p>

      {error && (
        <p className="text-sm text-red-400 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
          {error}
        </p>
      )}

      <button
        onClick={() => advancePeriod()}
        disabled={isAdvancing}
        className="btn-primary w-full"
      >
        {isAdvancing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border border-t-white border-white/30 rounded-full animate-spin" />
            Advancing Period...
          </span>
        ) : (
          'Advance to Next Pay Period'
        )}
      </button>
    </div>
  );
}
