'use client';

import { useState } from 'react';
import { Address, formatUnits, parseUnits } from 'viem';
import { useReadContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { PAYSHIELD_PAYROLL_ABI, PAYSHIELD_VAULT_ABI, MOCK_USDC_ABI } from '@payshield/sdk';
import { getContractAddresses } from '../../lib/contractAddresses';
import { TARGET_CHAIN_ID } from '../../lib/chains';
import { useEnsureChain } from '../../hooks/useEnsureChain';
import { useBufferedWriteContract } from '../../hooks/useBufferedWriteContract';

interface FundPayrollCardProps {
  payrollAddress: Address;
  onSuccess?: () => void;
}

export function FundPayrollCard({ payrollAddress, onSuccess }: FundPayrollCardProps) {
  const { address: userAddress } = useAccount();
  const contracts = getContractAddresses(TARGET_CHAIN_ID);
  const { ensureChain } = useEnsureChain();

  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'idle' | 'approving' | 'funding' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  const { writeContractAsync } = useBufferedWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const { data: vaultAddress } = useReadContract({
    address: payrollAddress,
    abi: PAYSHIELD_PAYROLL_ABI,
    functionName: 'vaultAddress',
    query: { enabled: !!payrollAddress },
  });

  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: contracts.mockUSDC,
    abi: MOCK_USDC_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress && !!contracts.mockUSDC },
  });

  const { data: vaultBalance, refetch: refetchVault } = useReadContract({
    address: vaultAddress as Address | undefined,
    abi: PAYSHIELD_VAULT_ABI,
    functionName: 'getBalance',
    query: { enabled: !!vaultAddress },
  });

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !contracts.mockUSDC || !vaultAddress) return;
    setError(null);
    const parsed = parseUnits(amount, 6);

    try {
      await ensureChain();
      setStep('approving');
      await writeContractAsync({
        chainId: TARGET_CHAIN_ID,
        address: contracts.mockUSDC,
        abi: MOCK_USDC_ABI,
        functionName: 'approve',
        args: [vaultAddress as Address, parsed],
      });

      setStep('funding');
      const fundHash = await writeContractAsync({
        chainId: TARGET_CHAIN_ID,
        address: vaultAddress as Address,
        abi: PAYSHIELD_VAULT_ABI,
        functionName: 'deposit',
        args: [parsed],
      });

      setTxHash(fundHash);
      setStep('done');
      refetchBalance();
      refetchVault();
      onSuccess?.();
    } catch (e: any) {
      setError(e?.shortMessage ?? e?.message ?? 'Funding failed');
      setStep('idle');
    }
  };

  const mintTestUsdc = async () => {
    if (!contracts.mockUSDC || !userAddress) return;
    try {
      await ensureChain();
      await writeContractAsync({
        chainId: TARGET_CHAIN_ID,
        address: contracts.mockUSDC,
        abi: MOCK_USDC_ABI,
        functionName: 'faucet',
        args: [],
      });
      refetchBalance();
    } catch (e: any) {
      setError(e?.shortMessage ?? e?.message ?? 'Faucet failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-lg p-4">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Your mUSDC</p>
          <p className="text-lg font-bold font-mono text-white">
            {usdcBalance ? formatUnits(usdcBalance as bigint, 6) : '—'}
          </p>
        </div>
        <div className="glass rounded-lg p-4">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Vault Balance</p>
          <p className="text-lg font-bold font-mono text-cyan-400">
            {vaultBalance ? formatUnits(vaultBalance as bigint, 6) : '—'}
          </p>
        </div>
      </div>

      <button onClick={mintTestUsdc} className="btn-ghost text-xs w-full py-2">
        🚰 Claim 100,000 Test mUSDC (Faucet)
      </button>

      {step === 'done' ? (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
          <p className="text-emerald-400 font-semibold">✓ Payroll Funded</p>
          <p className="text-sm text-white/40 mt-1">{amount} USDC deposited into vault</p>
          <button
            onClick={() => {
              setStep('idle');
              setAmount('');
            }}
            className="btn-ghost text-xs mt-3"
          >
            Fund Again
          </button>
        </div>
      ) : (
        <form onSubmit={handleFund} className="space-y-3">
          <div className="relative">
            <input
              type="number"
              placeholder="Amount to deposit"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field w-full pr-16"
              required
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/40 font-mono">
              USDC
            </span>
          </div>

          {step !== 'idle' && (
            <div className="text-xs text-cyan-400 flex items-center gap-2">
              <div className="w-3 h-3 border border-t-cyan-400 border-white/20 rounded-full animate-spin" />
              {step === 'approving' ? 'Approving USDC spend...' : 'Depositing into vault...'}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
              {error}
            </p>
          )}

          <button type="submit" disabled={step !== 'idle' || !amount} className="btn-primary w-full">
            Fund Payroll Vault
          </button>
        </form>
      )}
    </div>
  );
}
