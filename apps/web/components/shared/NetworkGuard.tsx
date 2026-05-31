"use client";

import { useEnsureChain } from "../../hooks/useEnsureChain";
import { isMainnet } from "../../lib/chains";

export function NetworkGuard() {
  const {
    isWrongChain,
    isSwitching,
    ensureChain,
    targetChainName,
    currentChainName,
    chainId,
    targetChainId,
  } = useEnsureChain();

  if (!isWrongChain) return null;

  const onMainnet = isMainnet(chainId);

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[calc(100%-2rem)] rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
      style={{
        background: onMainnet ? "rgba(255,77,109,0.12)" : "rgba(255,180,0,0.12)",
        border: `1px solid ${onMainnet ? "rgba(255,77,109,0.35)" : "rgba(255,180,0,0.35)"}`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
      }}
    >
      <div className="flex-1 text-sm">
        <p className="font-semibold" style={{ color: onMainnet ? "#ff4d6d" : "#ffb400" }}>
          {onMainnet ? "Wrong network — you are on Ethereum Mainnet" : "Wrong network"}
        </p>
        <p className="text-white/60 text-xs mt-0.5">
          Connected to <strong className="text-white/80">{currentChainName}</strong>.
          PayShield requires <strong className="text-white/80">{targetChainName}</strong> (chain{" "}
          {targetChainId}) so gas is paid in test ETH, not mainnet ETH.
        </p>
      </div>
      <button
        type="button"
        onClick={() => ensureChain().catch(() => {})}
        disabled={isSwitching}
        className="btn-primary shrink-0 px-4 py-2 text-sm whitespace-nowrap"
      >
        {isSwitching ? "Switching…" : `Switch to ${targetChainName}`}
      </button>
    </div>
  );
}
