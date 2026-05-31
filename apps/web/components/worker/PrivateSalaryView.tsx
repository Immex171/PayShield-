'use client';

import { useState } from 'react';
import { Address } from 'viem';
import { useWorkerPayroll } from '../../hooks/useWorkerPayroll';

interface PrivateSalaryViewProps {
  payrollAddress: Address;
}

export function PrivateSalaryView({ payrollAddress }: PrivateSalaryViewProps) {
  const { isWorker, isDecrypting, decryptedSalary, decryptError, getSealedSalary } =
    useWorkerPayroll(payrollAddress);
  const [revealed, setRevealed] = useState(false);

  const handleReveal = async () => {
    await getSealedSalary();
    setRevealed(true);
  };

  if (!isWorker) return null;

  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-cyan-400">🔐</span>
        <h3 className="font-semibold text-white">Private Salary View</h3>
      </div>

      <p className="text-sm text-white/50">
        Your encrypted salary is stored on Fhenix using FHE. Only you can decrypt and view the
        value — it&apos;s sealed using your wallet&apos;s public key.
      </p>

      <div className="glass-strong rounded-lg p-5 text-center">
        {!revealed ? (
          <>
            <div className="salary-redacted encrypted-pulse text-3xl font-mono font-bold mb-2">
              ●●●●●
            </div>
            <p className="text-xs text-white/30 mb-4">
              Encrypted on-chain — click below to decrypt client-side
            </p>
            <button
              onClick={handleReveal}
              disabled={isDecrypting}
              className="btn-primary text-sm"
            >
              {isDecrypting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border border-t-white border-white/30 rounded-full animate-spin" />
                  Decrypting via FHE...
                </span>
              ) : (
                '🔓 Decrypt My Salary'
              )}
            </button>
          </>
        ) : decryptedSalary ? (
          <>
            <p className="text-xs text-emerald-400/70 uppercase tracking-wider mb-2">
              Decrypted Successfully
            </p>
            <div className="text-4xl font-bold font-mono gradient-text mb-2">
              ${parseFloat(decryptedSalary).toLocaleString()}
            </div>
            <p className="text-xs text-white/30">USDC / month</p>
            <button
              onClick={() => setRevealed(false)}
              className="btn-ghost text-xs mt-4"
            >
              Hide Salary
            </button>
          </>
        ) : decryptError ? (
          <p className="text-sm text-red-400">{decryptError}</p>
        ) : null}
      </div>

      <p className="text-xs text-white/25 italic">
        Note: Decryption happens in your browser using the FHE client — the plaintext never leaves
        your device.
      </p>
    </div>
  );
}
