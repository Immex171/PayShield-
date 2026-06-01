'use client';

import { useState, useCallback } from 'react';
import { useWaitForTransactionReceipt } from 'wagmi';
import { Address } from 'viem';
import { PAYSHIELD_PAYROLL_ABI } from '@payshield/sdk';
import { useEnsureChain } from './useEnsureChain';
import { useBufferedWriteContract } from './useBufferedWriteContract';
import { TARGET_CHAIN_ID } from '../lib/chains';
import {
  generateStealthPayoutAddress,
  saveStealthKeyPair,
  type StealthKeyPair,
} from '../lib/stealthAddress';

export function useStealthPayout(payrollAddress?: Address) {
  const { writeContractAsync } = useBufferedWriteContract();
  const { ensureChain } = useEnsureChain();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyPair, setKeyPair] = useState<StealthKeyPair | null>(null);

  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const generateAndSetPayout = useCallback(async () => {
    if (!payrollAddress) return;
    setError(null);
    setIsPending(true);

    try {
      const keys = generateStealthPayoutAddress();
      setKeyPair(keys);

      await ensureChain();
      const hash = await writeContractAsync({
        chainId: TARGET_CHAIN_ID,
        address: payrollAddress,
        abi: PAYSHIELD_PAYROLL_ABI,
        functionName: 'setPayoutAddress',
        args: [keys.payoutAddress],
      });
      setTxHash(hash);
      saveStealthKeyPair(payrollAddress, keys);
      return { hash, keys };
    } catch (e: any) {
      setError(e?.shortMessage ?? e?.message ?? 'Failed to set stealth payout address');
      throw e;
    } finally {
      setIsPending(false);
    }
  }, [payrollAddress, writeContractAsync, ensureChain]);

  const reset = useCallback(() => {
    setTxHash(undefined);
    setError(null);
    setKeyPair(null);
    setIsPending(false);
  }, []);

  return {
    generateAndSetPayout,
    keyPair,
    isPending,
    isSuccess: isConfirmed,
    txHash,
    error,
    reset,
  };
}
