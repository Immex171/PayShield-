'use client';

import { useState, useCallback } from 'react';
import { useReadContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { Address } from 'viem';
import { PAYSHIELD_PAYROLL_ABI } from '@payshield/sdk';
import { useEnsureChain } from './useEnsureChain';
import { useBufferedWriteContract } from './useBufferedWriteContract';
import { TARGET_CHAIN_ID } from '../lib/chains';

export function useAuditorAccess(payrollAddress?: Address) {
  const { address: userAddress } = useAccount();
  const { writeContractAsync } = useBufferedWriteContract();
  const { ensureChain } = useEnsureChain();
  const [isPending, setIsPending] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<string | null>(null);

  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const { data: isAuditor, isLoading: isCheckingAuditor, refetch } = useReadContract({
    address: payrollAddress,
    abi: PAYSHIELD_PAYROLL_ABI,
    functionName: 'hasAuditorAccess',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!payrollAddress && !!userAddress },
  });

  const grantAuditorAccess = useCallback(
    async (auditorAddress: Address) => {
      if (!payrollAddress) {
        setError('No payroll address');
        return;
      }
      setError(null);
      setIsPending(true);
      try {
        await ensureChain();
        const hash = await writeContractAsync({
          chainId: TARGET_CHAIN_ID,
          address: payrollAddress,
          abi: PAYSHIELD_PAYROLL_ABI,
          functionName: 'grantAuditorAccess',
          args: [auditorAddress],
        });
        setTxHash(hash);
        return hash;
      } catch (e: any) {
        setError(e?.shortMessage ?? e?.message ?? 'Failed to grant access');
        throw e;
      } finally {
        setIsPending(false);
      }
    },
    [payrollAddress, writeContractAsync, ensureChain]
  );

  const revokeAuditorAccess = useCallback(
    async (auditorAddress: Address) => {
      if (!payrollAddress) return;
      setError(null);
      setIsPending(true);
      try {
        await ensureChain();
        const hash = await writeContractAsync({
          chainId: TARGET_CHAIN_ID,
          address: payrollAddress,
          abi: PAYSHIELD_PAYROLL_ABI,
          functionName: 'revokeAuditorAccess',
          args: [auditorAddress],
        });
        setTxHash(hash);
        return hash;
      } catch (e: any) {
        setError(e?.shortMessage ?? e?.message ?? 'Failed to revoke access');
        throw e;
      } finally {
        setIsPending(false);
      }
    },
    [payrollAddress, writeContractAsync, ensureChain]
  );

  return {
    isAuditor: isAuditor as boolean | undefined,
    isLoading: isCheckingAuditor,
    isPending,
    isSuccess: isConfirmed,
    txHash,
    error,
    grantAuditorAccess,
    revokeAuditorAccess,
    refetch,
  };
}
