'use client';

import { useState, useCallback } from 'react';
import { useReadContract, useAccount, usePublicClient } from 'wagmi';
import { Address } from 'viem';
import { PAYSHIELD_PAYROLL_ABI, decryptWorkerSalary, formatSalaryDisplay } from '@payshield/sdk';
import { getCofheClient } from '../lib/cofheClient';

export function useWorkerPayroll(payrollAddress?: Address) {
  const { address: userAddress } = useAccount();
  const publicClient = usePublicClient();
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

  const { data: payoutAddress } = useReadContract({
    address: payrollAddress,
    abi: PAYSHIELD_PAYROLL_ABI,
    functionName: 'getPayoutAddress',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!payrollAddress && !!userAddress && !!isWorker },
  });

  const getSealedSalary = useCallback(async () => {
    if (!payrollAddress || !userAddress || !publicClient) return;
    setIsDecrypting(true);
    setDecryptError(null);
    setDecryptedSalary(null);

    try {
      const cofheClient = getCofheClient();
      if (!cofheClient) {
        throw new Error('CoFHE client not initialized — reconnect your wallet');
      }

      const permission = await cofheClient.generatePermission();
      const amount = await decryptWorkerSalary({
        payrollAddress,
        workerAddress: userAddress,
        publicClient,
        cofheClient,
        permission,
      });

      setDecryptedSalary(formatSalaryDisplay(amount));
    } catch (e: any) {
      setDecryptError(e?.message ?? 'Failed to decrypt salary');
    } finally {
      setIsDecrypting(false);
    }
  }, [payrollAddress, userAddress, publicClient]);

  return {
    isWorker: isWorker as boolean | undefined,
    workerRecord,
    payoutAddress: payoutAddress as Address | undefined,
    isLoading: isCheckingWorker || isLoadingInfo,
    isDecrypting,
    decryptedSalary,
    decryptError,
    getSealedSalary,
    refetch,
  };
}
