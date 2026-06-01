'use client';

import { useEffect } from 'react';
import { useAccount, useChainId, useWalletClient } from 'wagmi';
import { initCofheClient, resetCofheClient } from '../../lib/cofheClient';

/**
 * Initializes the CoFHE client when the wallet connects.
 * Real FHE on Fhenix Helium (8008135); mock mode on local/Arbitrum demo chains.
 */
export function CofheInit() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    if (!isConnected) {
      resetCofheClient();
      return;
    }

    const provider =
      typeof window !== 'undefined' && window.ethereum
        ? window.ethereum
        : walletClient;

    if (!provider) return;

    initCofheClient(provider, chainId).catch((err) => {
      console.warn('[PayShield] CoFHE init failed:', err);
    });
  }, [isConnected, chainId, walletClient]);

  return null;
}
