'use client';

import { useState } from 'react';
import { Address } from 'viem';
import { useEncryptPayroll } from '../../hooks/useEncryptPayroll';
import { EncryptionProgress } from '../shared/EmptyState';

interface AddEmployeeFormProps {
  payrollAddress: Address;
  onSuccess?: () => void;
}

export function AddEmployeeForm({ payrollAddress, onSuccess }: AddEmployeeFormProps) {
  const [workerAddress, setWorkerAddress] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [salary, setSalary] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { addWorker, isPending, encryptingStep, isSuccess, error, reset } = useEncryptPayroll();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerAddress || !employeeId || !salary) return;

    try {
      await addWorker({
        payrollAddress,
        workerAddress: workerAddress as Address,
        employeeId,
        salaryAmount: salary,
      });
      setSubmitted(true);
      onSuccess?.();
    } catch {}
  };

  if (isSuccess && submitted) {
    return (
      <div className="glass rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 text-emerald-400">
          <span className="text-2xl">✓</span>
          <div>
            <p className="font-semibold">Worker Added Successfully</p>
            <p className="text-sm text-white/40">Salary encrypted and stored on-chain via FHE</p>
          </div>
        </div>
        <button
          onClick={() => {
            setSubmitted(false);
            setWorkerAddress('');
            setEmployeeId('');
            setSalary('');
            reset();
          }}
          className="btn-ghost text-sm"
        >
          Add Another Worker
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
          Worker Wallet Address
        </label>
        <input
          type="text"
          placeholder="0x..."
          value={workerAddress}
          onChange={(e) => setWorkerAddress(e.target.value)}
          className="input-field w-full font-mono text-sm"
          required
        />
        <p className="text-xs text-white/30 mt-1">Wallet address that will receive payment</p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
          Employee ID / Reference
        </label>
        <input
          type="text"
          placeholder="e.g. EMP-001 or contractor-alice"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          className="input-field w-full"
          required
        />
        <p className="text-xs text-white/30 mt-1">
          This is hashed before being stored — never stored as plaintext on-chain
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
          Monthly Salary (USDC)
        </label>
        <div className="relative">
          <input
            type="number"
            placeholder="5000"
            min="0"
            step="0.01"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            className="input-field w-full pr-16"
            required
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/40 font-mono">
            USDC
          </span>
        </div>
        <p className="text-xs text-cyan-400/70 mt-1">
          🔐 This value will be encrypted client-side before transmission — never sent in plaintext
        </p>
      </div>

      {encryptingStep !== 'idle' && <EncryptionProgress step={encryptingStep} />}

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !workerAddress || !employeeId || !salary}
        className="btn-primary w-full"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border border-t-white border-white/30 rounded-full animate-spin" />
            {encryptingStep === 'encrypting' ? 'Encrypting...' : 'Submitting...'}
          </span>
        ) : (
          '🔐 Encrypt & Add Worker'
        )}
      </button>
    </form>
  );
}
