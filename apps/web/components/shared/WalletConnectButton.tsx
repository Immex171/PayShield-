"use client";

import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi";
import { injected } from "wagmi/connectors";
import { Wallet, ChevronDown, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { getChainName, TARGET_CHAIN_ID } from "../../lib/chains";
import { useEnsureChain } from "../../hooks/useEnsureChain";

function truncate(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function WalletConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { isWrongChain, ensureChain, isSwitching, targetChainName } = useEnsureChain();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: injected(), chainId: TARGET_CHAIN_ID })}
        disabled={isPending}
        className="btn-primary flex items-center gap-2 px-4 py-2 text-sm font-semibold"
        style={{ minWidth: 140 }}
      >
        <Wallet className="w-4 h-4" />
        {isPending ? "Connecting..." : "Connect Wallet"}
      </button>
    );
  }

  const networkName = getChainName(chainId);
  const networkColor = isWrongChain ? "#ff4d6d" : "#10d98c";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
        style={{
          background: "rgba(0,212,255,0.06)",
          border: "1px solid rgba(0,212,255,0.2)",
          color: "#e8f4f8",
        }}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: networkColor, boxShadow: `0 0 6px ${networkColor}` }}
        />
        <span className="font-mono text-xs">{truncate(address!)}</span>
        <ChevronDown className="w-3 h-3 opacity-50" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-52 rounded-xl p-1 z-50"
          style={{
            background: "#0f1e2e",
            border: "1px solid rgba(0,212,255,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <div className="px-3 py-2 border-b" style={{ borderColor: "rgba(0,212,255,0.08)" }}>
            <p className="text-xs" style={{ color: "#7ba3bb" }}>Connected to</p>
            <p className="text-xs font-semibold" style={{ color: isWrongChain ? "#ff4d6d" : "#00d4ff" }}>
              {networkName}
              {isWrongChain ? " (wrong)" : ""}
            </p>
          </div>
          {isWrongChain && (
            <button
              type="button"
              onClick={() => ensureChain().catch(() => {})}
              disabled={isSwitching}
              className="w-full mx-1 mb-1 px-3 py-2 rounded-lg text-xs font-semibold text-left"
              style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff" }}
            >
              {isSwitching ? "Switching network…" : `Switch to ${targetChainName}`}
            </button>
          )}
          <div className="px-3 py-2 border-b" style={{ borderColor: "rgba(0,212,255,0.08)" }}>
            <p className="text-xs mb-1" style={{ color: "#7ba3bb" }}>Address</p>
            <p className="font-mono text-xs" style={{ color: "#e8f4f8", wordBreak: "break-all" }}>
              {address}
            </p>
          </div>
          <button
            onClick={() => { disconnect(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all hover:bg-red-500/10"
            style={{ color: "#ff4d6d" }}
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
