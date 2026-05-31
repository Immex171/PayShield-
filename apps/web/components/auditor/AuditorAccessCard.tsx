'use client';

import { useState } from 'react';
import { Address } from 'viem';
import { useAuditorAccess } from '../../hooks/useAuditorAccess';
import { useAccount } from 'wagmi';

interface AuditorAccessCardProps {
  payrollAddress: Address;
  isCompanyAdmin?: boolean;
}

export function AuditorAccessCard({ payrollAddress, isCompanyAdmin = false }: AuditorAccessCardProps) {
  const { address: userAddress } = useAccount();
  const { isAuditor, isPending, isSuccess, error, grantAuditorAccess, revokeAuditorAccess } =
    useAuditorAccess(payrollAddress);

  const [auditorInput, setAuditorInput] = useState('');
  const [actionResult, setActionResult] = useState<string | null>(null);

  const handleGrant = async () => {
    if (!auditorInput) return;
    try {
      await grantAuditorAccess(auditorInput as Address);
      setActionResult(`Access granted to ${auditorInput.slice(0, 8)}...`);
      setAuditorInput('');
    } catch {}
  };

  const handleRevoke = async () => {
    if (!auditorInput) return;
    try {
      await revokeAuditorAccess(auditorInput as Address);
      setActionResult(`Access revoked from ${auditorInput.slice(0, 8)}...`);
      setAuditorInput('');
    } catch {}
  };

  // Worker auditor view
  if (!isCompanyAdmin) {
    return (
      <div className="glass rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span>🔍</span>
          <h3 className="font-semibold text-white">Auditor Access</h3>
          {isAuditor && <span className="badge-active text-xs">Granted</span>}
        </div>

        {isAuditor ? (
          <div className="space-y-3">
            <p className="text-sm text-white/50">
              You have auditor access to this payroll. You can view worker counts, vault balances,
              and verify payment flows — but individual salary amounts remain encrypted.
            </p>
            <div className="glass-strong rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/40">Individual Salaries</span>
                <span className="salary-redacted text-xs">●●●●●</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Worker Count</span>
                <span className="text-emerald-400">✓ Visible</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Vault Balance</span>
                <span className="text-emerald-400">✓ Visible</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Payment History</span>
                <span className="text-emerald-400">✓ Visible</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-white/40">
            You do not currently have auditor access to this payroll. Request access from the
            company admin.
          </p>
        )}
      </div>
    );
  }

  // Company admin view — grant/revoke auditor access
  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span>🔍</span>
        <h3 className="font-semibold text-white">Manage Auditor Access</h3>
      </div>

      <p className="text-sm text-white/50">
        Grant trusted auditors read-only access to payroll metadata. They cannot decrypt individual
        salary amounts — only aggregate stats.
      </p>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Auditor wallet address (0x...)"
          value={auditorInput}
          onChange={(e) => setAuditorInput(e.target.value)}
          className="input-field w-full font-mono text-sm"
        />

        <div className="flex gap-3">
          <button
            onClick={handleGrant}
            disabled={isPending || !auditorInput}
            className="btn-primary flex-1 text-sm"
          >
            {isPending ? 'Processing...' : 'Grant Access'}
          </button>
          <button
            onClick={handleRevoke}
            disabled={isPending || !auditorInput}
            className="btn-ghost flex-1 text-sm"
          >
            Revoke Access
          </button>
        </div>
      </div>

      {actionResult && (
        <p className="text-sm text-emerald-400 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
          ✓ {actionResult}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-400 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
          {error}
        </p>
      )}
    </div>
  );
}
