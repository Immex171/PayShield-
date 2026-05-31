'use client';

import { useState, useCallback } from 'react';
import { useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { Address } from 'viem';
import { PAYSHIELD_PAYROLL_ABI } from '@payshield/sdk';
import { useEnsureChain } from './useEnsureChain';
import { useBufferedWriteContract } from './useBufferedWriteContract';
import { TARGET_CHAIN_ID } from '../lib/chains';

export function useClaimSalary(payrollAddress?: Address) {
  const { address: userAddress } = useAccount();
  const { writeContractAsync } = useBufferedWriteContract();
  const { ensureChain } = useEnsureChain();
  const [isPending, setIsPending] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [claimStep, setClaimStep] = useState<'idle' | 'preparing' | 'signing' | 'confirming' | 'done'>('idle');

  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const claimSalary = useCallback(async () => {
    if (!payrollAddress || !userAddress) {
      setError('Wallet not connected or no payroll selected');
      return;
    }
    setError(null);
    setIsPending(true);
    setClaimStep('preparing');

    try {
      setClaimStep('signing');
      await ensureChain();
      const hash = await writeContractAsync({
        chainId: TARGET_CHAIN_ID,
        address: payrollAddress,
        abi: PAYSHIELD_PAYROLL_ABI,
        functionName: 'claimSalary',
        args: [],
      });
      setTxHash(hash);
      setClaimStep('confirming');
      return hash;
    } catch (e: any) {
      setError(e?.shortMessage ?? e?.message ?? 'Claim failed');
      setClaimStep('idle');
      throw e;
    } finally {
      setIsPending(false);
    }
  }, [payrollAddress, userAddress, writeContractAsync, ensureChain]);

  const reset = useCallback(() => {
    setClaimStep('idle');
    setTxHash(undefined);
    setError(null);
    setIsPending(false);
  }, []);

  return {
    claimSalary,
    isPending: isPending,
    claimStep,
    isSuccess: isConfirmed,
    txHash,
    error,
    reset,
  };
}
