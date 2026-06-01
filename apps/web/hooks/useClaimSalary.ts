'use client';

import { useState, useCallback } from 'react';
import { useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { Address } from 'viem';
import { PAYSHIELD_PAYROLL_ABI } from '@payshield/sdk';
import { useEnsureChain } from './useEnsureChain';
import { useBufferedWriteContract } from './useBufferedWriteContract';
import { TARGET_CHAIN_ID } from '../lib/chains';

const DECRYPT_RETRY_ATTEMPTS = 6;
const DECRYPT_RETRY_DELAY_MS = 3000;

function isDecryptionNotReady(err: unknown): boolean {
  const msg = (err as { message?: string; shortMessage?: string })?.shortMessage
    ?? (err as { message?: string })?.message
    ?? '';
  return msg.toLowerCase().includes('decryptionnotready')
    || msg.toLowerCase().includes('decryption not ready');
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useClaimSalary(payrollAddress?: Address) {
  const { address: userAddress } = useAccount();
  const { writeContractAsync } = useBufferedWriteContract();
  const { ensureChain } = useEnsureChain();
  const [isPending, setIsPending] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [claimStep, setClaimStep] = useState<
    'idle' | 'preparing' | 'decrypting' | 'signing' | 'confirming' | 'done'
  >('idle');

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
      await ensureChain();

      // Step 1: Request FHE decryption
      setClaimStep('decrypting');
      await writeContractAsync({
        chainId: TARGET_CHAIN_ID,
        address: payrollAddress,
        abi: PAYSHIELD_PAYROLL_ABI,
        functionName: 'prepareClaimDecrypt',
        args: [],
      });

      // Step 2: Poll claimSalary until decrypt result is ready
      for (let attempt = 0; attempt < DECRYPT_RETRY_ATTEMPTS; attempt++) {
        try {
          if (attempt > 0) {
            await sleep(DECRYPT_RETRY_DELAY_MS);
          }
          setClaimStep('signing');
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
        } catch (e) {
          if (isDecryptionNotReady(e) && attempt < DECRYPT_RETRY_ATTEMPTS - 1) {
            setClaimStep('decrypting');
            continue;
          }
          throw e;
        }
      }
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
    isPending,
    claimStep,
    isSuccess: isConfirmed,
    txHash,
    error,
    reset,
  };
}
