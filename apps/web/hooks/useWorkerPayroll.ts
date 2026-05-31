'use client';

import { useState, useCallback } from 'react';
import { useReadContract, useAccount } from 'wagmi';
import { Address } from 'viem';
import { PAYSHIELD_PAYROLL_ABI } from '@payshield/sdk';
import { getCofheClient } from '../lib/cofheClient';

export function useWorkerPayroll(payrollAddress?: Address) {
  const { address: userAddress } = useAccount();
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedSalary, setDecryptedSalary] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  const { data: isWorker, isLoading: isCheckingWorker } = useReadContract({
    address: payrollAddress,
    abi: PAYSHIELD_PAYROLL_ABI,
    functionName: 'isActiveWorker',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!payrollAddress && !!userAddress },
  });

  const { data: workerRecord, isLoading: isLoadingInfo, refetch } = useReadContract({
    address: payrollAddress,
    abi: PAYSHIELD_PAYROLL_ABI,
    functionName: 'getWorkerRecord',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!payrollAddress && !!userAddress && !!isWorker },
  });

  const getSealedSalary = useCallback(async () => {
    if (!payrollAddress || !userAddress) return;
    setIsDecrypting(true);
    setDecryptError(null);
    setDecryptedSalary(null);

    try {
      await getCofheClient();
      // Mock/local: salary display is a demo placeholder until full CoFHE unseal is wired
      setDecryptedSalary('5000.00');
    } catch (e: any) {
      setDecryptError(e?.message ?? 'Failed to decrypt salary');
    } finally {
      setIsDecrypting(false);
    }
  }, [payrollAddress, userAddress]);

  return {
    isWorker: isWorker as boolean | undefined,
    workerRecord,
    isLoading: isCheckingWorker || isLoadingInfo,
    isDecrypting,
    decryptedSalary,
    decryptError,
    getSealedSalary,
    refetch,
  };
}
