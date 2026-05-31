import type { PublicClient } from "viem";

/** Apply headroom so fees stay above a rising base fee between estimate and submit. */
const FEE_MULTIPLIER_BPS = 15000n; // 1.5×

function scaleFee(value: bigint): bigint {
  return (value * FEE_MULTIPLIER_BPS) / 10000n;
}

export async function getBufferedGasFees(publicClient: PublicClient) {
  const [fees, block] = await Promise.all([
    publicClient.estimateFeesPerGas(),
    publicClient.getBlock({ blockTag: "latest" }),
  ]);

  const baseFee = block.baseFeePerGas ?? 0n;
  const priority = fees.maxPriorityFeePerGas ?? 1_000_000n;
  const estimatedMax = fees.maxFeePerGas ?? baseFee + priority;

  let maxFeePerGas = scaleFee(estimatedMax);
  const maxPriorityFeePerGas = scaleFee(priority);

  // Must exceed current base fee at submission time
  const minMaxFee = scaleFee(baseFee) + maxPriorityFeePerGas;
  if (maxFeePerGas < minMaxFee) {
    maxFeePerGas = minMaxFee;
  }

  return { maxFeePerGas, maxPriorityFeePerGas };
}
