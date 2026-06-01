'use client';

import { useAccount } from 'wagmi';
import { Address } from 'viem';
import { useStealthPayout } from '../../hooks/useStealthPayout';
import { useWorkerPayroll } from '../../hooks/useWorkerPayroll';
import { loadStealthKeyPair } from '../../lib/stealthAddress';

interface StealthPayoutCardProps {
  payrollAddress: Address;
}

export function StealthPayoutCard({ payrollAddress }: StealthPayoutCardProps) {
  const { address } = useAccount();
  const { payoutAddress, isWorker } = useWorkerPayroll(payrollAddress);
  const { generateAndSetPayout, keyPair, isPending, isSuccess, error } =
    useStealthPayout(payrollAddress);

  if (!isWorker || !address) return null;

  const storedKeys = loadStealthKeyPair(payrollAddress);
  const effectivePayout = keyPair?.payoutAddress ?? payoutAddress;
  const usingStealth =
    !!effectivePayout &&
    !!storedKeys &&
    effectivePayout.toLowerCase() !== address.toLowerCase();

  return (
    <div className="glass rounded-xl p-6 space-y-4 border border-violet-500/10">
      <div className="flex items-center gap-2">
        <span className="text-violet-400">🕵️</span>
        <h3 className="font-semibold text-white">Stealth Payout Address</h3>
      </div>

      <p className="text-sm text-white/50">
        Generate a one-time payout address so salary claims are not linked to your main wallet
        on-chain. You hold the private key locally to sweep funds after claiming.
      </p>

      {effectivePayout && usingStealth && (
        <div className="glass-strong rounded-lg p-4">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Active Payout Address</p>
          <p className="font-mono text-xs text-violet-300 break-all">{effectivePayout}</p>
        </div>
      )}

      {isSuccess && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400">
          Stealth payout address registered. Your next claim will send funds here instead of your
          connected wallet.
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
          {error}
        </p>
      )}

      <button
        onClick={() => generateAndSetPayout()}
        disabled={isPending}
        className="btn-ghost w-full border border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
      >
        {isPending ? 'Generating...' : usingStealth ? 'Generate New Stealth Address' : 'Enable Stealth Payout'}
      </button>
    </div>
  );
}
