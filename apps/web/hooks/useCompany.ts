'use client';

import { useState, useCallback } from 'react';
import { useReadContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { Address, parseUnits } from 'viem';
import { PAYSHIELD_FACTORY_ABI, MOCK_USDC_ABI } from '@payshield/sdk';
import { getContractAddresses } from '../lib/contractAddresses';
import { useEnsureChain } from './useEnsureChain';
import { useBufferedWriteContract } from './useBufferedWriteContract';
import { TARGET_CHAIN_ID } from '../lib/chains';

export function useCompany() {
  const { address: userAddress, chainId } = useAccount();
  const contracts = chainId ? getContractAddresses(chainId) : null;
  const [isPending, setIsPending] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<string | null>(null);

  const {
    data: companyPayrollAddress,
    isLoading: isLoadingPayroll,
    refetch: refetchPayroll,
  } = useReadContract({
    address: contracts?.payShieldFactory,
    abi: PAYSHIELD_FACTORY_ABI,
    functionName: 'getPayroll',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress && !!contracts?.payShieldFactory },
  });

  const { writeContractAsync } = useBufferedWriteContract();
  const { ensureChain } = useEnsureChain();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  const createPayroll = useCallback(
    async (_companyName?: string, tokenAddress?: Address) => {
      if (!contracts?.payShieldFactory || !userAddress) {
        setError('No factory contract or wallet not connected');
        return;
      }
      setError(null);
      setIsPending(true);
      try {
        await ensureChain();
        const token = tokenAddress ?? contracts.mockUSDC;
        const hash = await writeContractAsync({
          chainId: TARGET_CHAIN_ID,
          address: contracts.payShieldFactory,
          abi: PAYSHIELD_FACTORY_ABI,
          functionName: 'createPayroll',
          args: [token],
        });
        setTxHash(hash);
        return hash;
      } catch (e: any) {
        setError(e?.shortMessage ?? e?.message ?? 'Transaction failed');
        throw e;
      } finally {
        setIsPending(false);
      }
    },
    [contracts, userAddress, writeContractAsync, ensureChain]
  );

  const mintTestUsdc = useCallback(async () => {
    if (!contracts?.mockUSDC || !userAddress) return;
    try {
      await ensureChain();
      const hash = await writeContractAsync({
        chainId: TARGET_CHAIN_ID,
        address: contracts.mockUSDC,
        abi: MOCK_USDC_ABI,
        functionName: 'faucet',
        args: [],
      });
      setTxHash(hash);
      return hash;
    } catch (e: any) {
      setError(e?.shortMessage ?? e?.message ?? 'Faucet failed');
      throw e;
    }
  }, [contracts, userAddress, writeContractAsync, ensureChain]);

  const refetch = useCallback(() => {
    refetchPayroll();
  }, [refetchPayroll]);

  return {
    companyPayrollAddress: companyPayrollAddress as Address | undefined,
    isLoading: isLoadingPayroll,
    isPending: isPending || isConfirming,
    isSuccess: isConfirmed,
    txHash,
    error,
    createPayroll,
    mintTestUsdc,
    refetch,
  };
}
