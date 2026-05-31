'use client';

import { useChainId } from 'wagmi';

interface TxStatusBadgeProps {
  hash?: `0x${string}`;
  isLoading?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  errorMessage?: string;
  loadingLabel?: string;
  successLabel?: string;
  className?: string;
}

export function TxStatusBadge({
  hash,
  isLoading,
  isSuccess,
  isError,
  errorMessage,
  loadingLabel = 'Confirming transaction...',
  successLabel = 'Transaction confirmed',
  className = '',
}: TxStatusBadgeProps) {
  const chainId = useChainId();

  const explorerBase =
    chainId === 8008135
      ? 'https://explorer.helium.fhenix.zone/tx'
      : null;

  if (isError) {
    return (
      <div className={`rounded-lg bg-red-500/10 border border-red-500/20 p-3 ${className}`}>
        <p className="text-sm text-red-400 font-medium">Transaction failed</p>
        {errorMessage && (
          <p className="text-xs text-red-400/70 mt-1">{errorMessage}</p>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`rounded-lg bg-cyan-400/5 border border-cyan-400/10 p-3 flex items-center gap-2 ${className}`}>
        <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin flex-shrink-0" />
        <p className="text-sm text-cyan-400">{loadingLabel}</p>
      </div>
    );
  }

  if (isSuccess && hash) {
    return (
      <div className={`rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-center gap-3 ${className}`}>
        <span className="text-emerald-400 text-lg">✓</span>
        <div>
          <p className="text-sm text-emerald-400 font-medium">{successLabel}</p>
          {explorerBase ? (
            <a
              href={`${explorerBase}/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-400/60 hover:text-emerald-400 transition-colors font-mono"
            >
              {hash.slice(0, 14)}...{hash.slice(-8)} ↗
            </a>
          ) : (
            <p className="text-xs text-emerald-400/50 font-mono">
              {hash.slice(0, 14)}...{hash.slice(-8)}
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
}

interface NetworkBadgeProps {
  className?: string;
}

export function NetworkBadge({ className = '' }: NetworkBadgeProps) {
  const chainId = useChainId();

  const networks: Record<number, { label: string; color: string }> = {
    412346: { label: 'Fhenix Local', color: 'text-violet-400 border-violet-400/20 bg-violet-400/5' },
    8008135: { label: 'Fhenix Helium', color: 'text-cyan-400 border-cyan-400/20 bg-cyan-400/5' },
  };

  const network = networks[chainId];

  if (!network) {
    return (
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border border-red-400/20 bg-red-400/5 text-red-400 ${className}`}>
        ⚠ Wrong Network
      </span>
    );
  }

  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${network.color} ${className}`}>
      ⛓ {network.label}
    </span>
  );
}
