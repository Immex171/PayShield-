"use client";

import { useCallback } from "react";
import { usePublicClient, useWriteContract } from "wagmi";

export function useBufferedWriteContract() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const writeContractBuffered = useCallback(
    async (params: Parameters<typeof writeContractAsync>[0]) => {
      if (publicClient) {
        const { getBufferedGasFees } = await import("../lib/gas");
        const gasFees = await getBufferedGasFees(publicClient);
        return writeContractAsync({
          ...params,
          maxFeePerGas: gasFees.maxFeePerGas,
          maxPriorityFeePerGas: gasFees.maxPriorityFeePerGas,
        } as Parameters<typeof writeContractAsync>[0]);
      }
      return writeContractAsync(params);
    },
    [writeContractAsync, publicClient]
  );

  return { writeContractAsync: writeContractBuffered };
}
