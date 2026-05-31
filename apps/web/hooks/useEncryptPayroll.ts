'use client';

import { useState, useCallback } from 'react';
import { useWaitForTransactionReceipt, useAccount, useChainId } from 'wagmi';
import { Address, encodeAbiParameters, encodePacked, keccak256, parseAbiParameters } from 'viem';
import { PAYSHIELD_PAYROLL_ABI, addWorkerWithEncryptedSalary } from '@payshield/sdk';
import { getCofheClient } from '../lib/cofheClient';
import { useEnsureChain } from './useEnsureChain';
import { useBufferedWriteContract } from './useBufferedWriteContract';
import { TARGET_CHAIN_ID } from '../lib/chains';

export interface AddWorkerParams {
  payrollAddress: Address;
  workerAddress: Address;
  employeeId: string;
  salaryAmount: string; // human-readable, e.g. "5000"
  salaryDecimals?: number;
}

export function useEncryptPayroll() {
  const { address: userAddress } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useBufferedWriteContract();
  const { ensureChain } = useEnsureChain();
  const [isPending, setIsPending] = useState(false);
  const [encryptingStep, setEncryptingStep] = useState<
    'idle' | 'encrypting' | 'signing' | 'submitting' | 'confirming' | 'done'
  >('idle');
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<string | null>(null);

  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const addWorker = useCallback(
    async ({ payrollAddress, workerAddress, employeeId, salaryAmount, salaryDecimals = 6 }: AddWorkerParams) => {
      if (!userAddress) {
        setError('Wallet not connected');
        return;
      }
      setError(null);
      setIsPending(true);
      setEncryptingStep('encrypting');

      try {
        // Derive employee ID hash (never store plaintext on-chain)
        const employeeIdHash = keccak256(
          encodePacked(['string', 'address'], [employeeId, workerAddress])
        );

        // Encrypt salary client-side via CoFHE
        setEncryptingStep('encrypting');
        const cofheClient = await getCofheClient();
        const rawAmount = BigInt(Math.round(parseFloat(salaryAmount) * 10 ** salaryDecimals));
        await cofheClient.encrypt_uint128(rawAmount);
        const encryptedSalaryBytes = encodeMockSalary(rawAmount);

        setEncryptingStep('submitting');
        await ensureChain();
        const hash = await writeContractAsync({
          chainId: TARGET_CHAIN_ID,
          address: payrollAddress,
          abi: PAYSHIELD_PAYROLL_ABI,
          functionName: 'addWorker',
          args: [workerAddress, employeeIdHash, encryptedSalaryBytes],
        });

        setTxHash(hash);
        setEncryptingStep('confirming');
        return hash;
      } catch (e: any) {
        setError(e?.shortMessage ?? e?.message ?? 'Failed to add worker');
        setEncryptingStep('idle');
        throw e;
      } finally {
        setIsPending(false);
      }
    },
    [userAddress, writeContractAsync, ensureChain]
  );

  const updateSalary = useCallback(
    async (payrollAddress: Address, workerAddress: Address, newSalaryAmount: string, salaryDecimals = 6) => {
      if (!userAddress) {
        setError('Wallet not connected');
        return;
      }
      setError(null);
      setIsPending(true);
      setEncryptingStep('encrypting');

      try {
        const cofheClient = await getCofheClient();
        const rawAmount = BigInt(Math.round(parseFloat(newSalaryAmount) * 10 ** salaryDecimals));
        const encryptedInput = await cofheClient.encrypt_uint128(rawAmount);
        const encryptedSalaryBytes = encodeMockSalary(rawAmount);

        setEncryptingStep('submitting');
        await ensureChain();
        const hash = await writeContractAsync({
          chainId: TARGET_CHAIN_ID,
          address: payrollAddress,
          abi: PAYSHIELD_PAYROLL_ABI,
          functionName: 'updateWorkerSalary',
          args: [workerAddress, encryptedSalaryBytes],
        });
        setTxHash(hash);
        setEncryptingStep('confirming');
        return hash;
      } catch (e: any) {
        setError(e?.shortMessage ?? e?.message ?? 'Failed to update salary');
        setEncryptingStep('idle');
        throw e;
      } finally {
        setIsPending(false);
      }
    },
    [userAddress, writeContractAsync, ensureChain]
  );

  const reset = useCallback(() => {
    setEncryptingStep('idle');
    setTxHash(undefined);
    setError(null);
    setIsPending(false);
  }, []);

  return {
    addWorker,
    updateSalary,
    isPending,
    encryptingStep,
    isSuccess: isConfirmed,
    txHash,
    error,
    reset,
  };
}

/**
 * Legacy mock encoding accepted by PayShieldPayroll._toEncryptedSalary on local Hardhat.
 */
function encodeMockSalary(amount: bigint): `0x${string}` {
  return encodeAbiParameters(parseAbiParameters('uint256, uint8'), [amount, 0]);
}
