'use client';

import { useCallback, useState } from 'react';
import { useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address } from 'viem';
import { PAYSHIELD_PAYROLL_ABI } from '@payshield/sdk';
import { useEnsureChain } from './useEnsureChain';
import { useBufferedWriteContract } from './useBufferedWriteContract';
import { TARGET_CHAIN_ID } from '../lib/chains';

export function usePayPeriod(payrollAddress?: Address, workerAddress?: Address) {
  const { writeContractAsync } = useBufferedWriteContract();
  const { ensureChain } = useEnsureChain();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: currentPeriodId, refetch: refetchPeriod } = useReadContract({
    address: payrollAddress,
    abi: PAYSHIELD_PAYROLL_ABI,
    functionName: 'currentPeriodId',
    query: { enabled: !!payrollAddress },
  });

  const { data: periodStartedAt, refetch: refetchStartedAt } = useReadContract({
    address: payrollAddress,
    abi: PAYSHIELD_PAYROLL_ABI,
    functionName: 'periodStartedAt',
    query: { enabled: !!payrollAddress },
  });

  const { data: hasClaimedCurrentPeriod, refetch: refetchClaimed } = useReadContract({
    address: payrollAddress,
    abi: PAYSHIELD_PAYROLL_ABI,
    functionName: 'hasClaimed',
    args:
      payrollAddress && workerAddress && currentPeriodId !== undefined
        ? [workerAddress, currentPeriodId]
        : undefined,
    query: {
      enabled: !!payrollAddress && !!workerAddress && currentPeriodId !== undefined,
    },
  });

  const { isSuccess: isAdvanceConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const advancePeriod = useCallback(async () => {
    if (!payrollAddress) return;
    setError(null);
    setIsAdvancing(true);
    try {
      await ensureChain();
      const hash = await writeContractAsync({
        chainId: TARGET_CHAIN_ID,
        address: payrollAddress,
        abi: PAYSHIELD_PAYROLL_ABI,
        functionName: 'advancePeriod',
        args: [],
      });
      setTxHash(hash);
      return hash;
    } catch (e: any) {
      setError(e?.shortMessage ?? e?.message ?? 'Failed to advance period');
      throw e;
    } finally {
      setIsAdvancing(false);
    }
  }, [payrollAddress, writeContractAsync, ensureChain]);

  const refetch = useCallback(() => {
    refetchPeriod();
    refetchStartedAt();
    refetchClaimed();
  }, [refetchPeriod, refetchStartedAt, refetchClaimed]);

  return {
    currentPeriodId: currentPeriodId as bigint | undefined,
    periodStartedAt: periodStartedAt as bigint | undefined,
    hasClaimedCurrentPeriod: hasClaimedCurrentPeriod as boolean | undefined,
    advancePeriod,
    isAdvancing,
    isAdvanceConfirmed,
    advanceTxHash: txHash,
    error,
    refetch,
  };
}
