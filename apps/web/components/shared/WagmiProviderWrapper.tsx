"use client";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "../../lib/wagmi";
import { NetworkGuard } from "./NetworkGuard";
import { useState } from "react";

export function WagmiProviderWrapper({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 10_000 },
    },
  }));

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
        <NetworkGuard />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
