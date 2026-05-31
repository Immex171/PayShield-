'use client';

import { Address } from 'viem';
import { useReadContract } from 'wagmi';
import { PAYSHIELD_PAYROLL_ABI } from '@payshield/sdk';

interface PayrollTableProps {
  payrollAddress: Address;
}

export function PayrollTable({ payrollAddress }: PayrollTableProps) {
  const { data: workers } = useReadContract({
    address: payrollAddress,
    abi: PAYSHIELD_PAYROLL_ABI,
    functionName: 'getWorkerList',
    query: { enabled: !!payrollAddress },
  });

  if (!workers || (workers as Address[]).length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <p className="text-white/40 text-sm">No workers added yet</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/70">Workers</h3>
        <span className="badge-encrypted text-xs">🔐 Salaries Encrypted</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-5 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">
                Wallet
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">
                Employee ID Hash
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">
                Salary
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {(workers as Address[]).map((walletAddr) => (
              <WorkerRow
                key={walletAddr}
                payrollAddress={payrollAddress}
                workerAddress={walletAddr}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-white/5">
        <p className="text-xs text-white/30">
          Salary column shows encrypted state — only the worker can decrypt their own value
        </p>
      </div>
    </div>
  );
}

function WorkerRow({
  payrollAddress,
  workerAddress,
}: {
  payrollAddress: Address;
  workerAddress: Address;
}) {
  const { data: workerRecord } = useReadContract({
    address: payrollAddress,
    abi: PAYSHIELD_PAYROLL_ABI,
    functionName: 'getWorkerRecord',
    args: [workerAddress],
  });

  const record = workerRecord as
    | {
        workerAddress: Address;
        employeeIdHash: string;
        status: number;
        registeredAt: bigint;
        lastClaimedAt: bigint;
        claimCount: bigint;
      }
    | undefined;

  const isActive = record?.status === 1;

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
      <td className="px-5 py-4">
        <span className="font-mono text-xs text-white/60">
          {workerAddress.slice(0, 8)}...{workerAddress.slice(-6)}
        </span>
      </td>
      <td className="px-5 py-4">
        <span className="font-mono text-xs text-white/30">
          {record?.employeeIdHash
            ? `${String(record.employeeIdHash).slice(0, 10)}...`
            : '—'}
        </span>
      </td>
      <td className="px-5 py-4">
        <span className="salary-redacted encrypted-pulse font-mono text-sm">●●●●●</span>
      </td>
      <td className="px-5 py-4">
        {record ? (
          <span className={isActive ? 'badge-active' : 'badge-warning'}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        ) : (
          <span className="text-white/20 text-xs">—</span>
        )}
      </td>
    </tr>
  );
}
