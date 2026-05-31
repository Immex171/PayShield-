"use client";

import { useCallback } from "react";
import { usePublicClient, useWriteContract } from "wagmi";
import type { WriteContractParameters } from "wagmi/actions";
import { getBufferedGasFees } from "../lib/gas";

export function useBufferedWriteContract() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const writeContractBuffered = useCallback(
    async (params: WriteContractParameters) => {
      if (publicClient) {
        const gasFees = await getBufferedGasFees(publicClient);
        return writeContractAsync({ ...params, ...gasFees });
      }
      return writeContractAsync(params);
    },
    [writeContractAsync, publicClient]
  );

  return { writeContractAsync: writeContractBuffered };
}
