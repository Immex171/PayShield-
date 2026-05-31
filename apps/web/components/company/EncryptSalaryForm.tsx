'use client';

import { useState } from 'react';
import { Address } from 'viem';
import { useEncryptPayroll } from '../../hooks/useEncryptPayroll';
import { EncryptionProgress } from '../shared/EmptyState';

interface EncryptSalaryFormProps {
  payrollAddress: Address;
  workerAddress: Address;
  currentDisplaySalary?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EncryptSalaryForm({
  payrollAddress,
  workerAddress,
  currentDisplaySalary,
  onSuccess,
  onCancel,
}: EncryptSalaryFormProps) {
  const [newSalary, setNewSalary] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const { updateSalary, isPending, encryptingStep, isSuccess, error, reset } = useEncryptPayroll();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSalary || !confirmed) return;
    try {
      await updateSalary(payrollAddress, workerAddress, newSalary);
      onSuccess?.();
    } catch {}
  };

  if (isSuccess) {
    return (
      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
        <p className="text-emerald-400 font-semibold">✓ Salary Updated</p>
        <p className="text-sm text-white/40 mt-1">New encrypted value stored on-chain</p>
        <button
          onClick={() => { reset(); setNewSalary(''); setConfirmed(false); }}
          className="btn-ghost text-xs mt-3"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {currentDisplaySalary && (
        <div className="glass-strong rounded-lg px-4 py-3 flex items-center justify-between text-sm">
          <span className="text-white/40">Current Salary</span>
          <span className="salary-redacted encrypted-pulse font-mono">●●●●●</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
          New Monthly Salary (USDC)
        </label>
        <div className="relative">
          <input
            type="number"
            placeholder="Enter new salary amount"
            min="0"
            step="0.01"
            value={newSalary}
            onChange={(e) => setNewSalary(e.target.value)}
            className="input-field w-full pr-16"
            required
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/40 font-mono">
            USDC
          </span>
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 accent-cyan-400"
        />
        <span className="text-sm text-white/50">
          I confirm this salary update will be encrypted before being stored on-chain.
          The previous encrypted value will be replaced.
        </span>
      </label>

      {encryptingStep !== 'idle' && <EncryptionProgress step={encryptingStep} />}

      {error && (
        <p className="text-sm text-red-400 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost flex-1">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isPending || !newSalary || !confirmed}
          className="btn-primary flex-1"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border border-t-white border-white/30 rounded-full animate-spin" />
              {encryptingStep === 'encrypting' ? 'Encrypting...' : 'Updating...'}
            </span>
          ) : (
            '🔐 Update Salary'
          )}
        </button>
      </div>
    </form>
  );
}
