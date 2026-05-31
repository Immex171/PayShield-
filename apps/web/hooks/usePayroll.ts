'use client';

import { useCallback } from 'react';
import { useReadContract } from 'wagmi';
import { Address } from 'viem';
import { PAYSHIELD_PAYROLL_ABI, PAYSHIELD_VAULT_ABI } from '@payshield/sdk';

export function usePayroll(payrollAddress?: Address) {
  const {
    data: workerCount,
    isLoading: isLoadingCount,
    refetch: refetchCount,
  } = useReadContract({
    address: payrollAddress,
    abi: PAYSHIELD_PAYROLL_ABI,
    functionName: 'workerCount',
    query: { enabled: !!payrollAddress },
  });

  const {
    data: vaultAddress,
    isLoading: isLoadingVaultAddr,
    refetch: refetchVaultAddr,
  } = useReadContract({
    address: payrollAddress,
    abi: PAYSHIELD_PAYROLL_ABI,
    functionName: 'vaultAddress',
    query: { enabled: !!payrollAddress },
  });

  const {
    data: vaultBalance,
    isLoading: isLoadingBalance,
    refetch: refetchBalance,
  } = useReadContract({
    address: vaultAddress as Address | undefined,
    abi: PAYSHIELD_VAULT_ABI,
    functionName: 'getBalance',
    query: { enabled: !!vaultAddress },
  });

  const refetch = useCallback(() => {
    refetchCount();
    refetchVaultAddr();
    refetchBalance();
  }, [refetchCount, refetchVaultAddr, refetchBalance]);

  return {
    workerCount: workerCount as bigint | undefined,
    vaultAddress: vaultAddress as Address | undefined,
    vaultBalance: vaultBalance as bigint | undefined,
    isLoading: isLoadingCount || isLoadingVaultAddr || isLoadingBalance,
    refetch,
  };
}
