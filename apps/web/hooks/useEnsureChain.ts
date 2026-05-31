'use client';

import { useCallback } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { getChainName, getTargetChain, TARGET_CHAIN_ID } from '../lib/chains';

export function useEnsureChain() {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const targetChain = getTargetChain();

  const isWrongChain = isConnected && chainId !== TARGET_CHAIN_ID;

  const ensureChain = useCallback(async () => {
    if (chainId === TARGET_CHAIN_ID) return;
    if (!switchChainAsync) {
      throw new Error(
        `Switch MetaMask to ${targetChain.name} (chain ${TARGET_CHAIN_ID}) before continuing.`
      );
    }
    await switchChainAsync({ chainId: TARGET_CHAIN_ID });
  }, [chainId, switchChainAsync, targetChain.name]);

  return {
    chainId,
    targetChainId: TARGET_CHAIN_ID,
    targetChainName: targetChain.name,
    currentChainName: getChainName(chainId),
    isWrongChain,
    isSwitching,
    ensureChain,
  };
}
