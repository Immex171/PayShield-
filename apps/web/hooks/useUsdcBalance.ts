'use client';

import { useReadContract, useAccount, useChainId } from 'wagmi';
import { Address, formatUnits } from 'viem';
import { MOCK_USDC_ABI } from '@payshield/sdk';
import { getContractAddresses } from '../lib/contractAddresses';

export function useUsdcBalance(targetAddress?: Address) {
  const { address: userAddress } = useAccount();
  const chainId = useChainId();
  const contracts = getContractAddresses(chainId);
  const addr = targetAddress ?? userAddress;

  const {
    data: balance,
    isLoading,
    refetch,
  } = useReadContract({
    address: contracts?.mockUsdc as Address,
    abi: MOCK_USDC_ABI,
    functionName: 'balanceOf',
    args: addr ? [addr] : undefined,
    query: { enabled: !!addr && !!contracts?.mockUsdc },
  });

  return {
    balance: balance as bigint | undefined,
    formatted: balance ? formatUnits(balance as bigint, 6) : null,
    display: balance
      ? `$${parseFloat(formatUnits(balance as bigint, 6)).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : null,
    isLoading,
    refetch,
  };
}
