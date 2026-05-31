import { formatUnits } from 'viem';

/**
 * Format a USDC amount (6 decimals) to human-readable string
 */
export function formatUsdc(amount: bigint, digits = 2): string {
  const raw = parseFloat(formatUnits(amount, 6));
  return raw.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/**
 * Format a unix timestamp to locale date string
 */
export function formatTimestamp(ts: bigint | number): string {
  const ms = typeof ts === 'bigint' ? Number(ts) * 1000 : ts * 1000;
  if (ms === 0) return 'Never';
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Truncate an address for display
 */
export function truncateAddress(addr: string, start = 6, end = 4): string {
  if (!addr) return '';
  return `${addr.slice(0, start + 2)}...${addr.slice(-end)}`;
}

/**
 * Format a salary display with currency prefix
 */
export function formatSalaryUsd(amount: bigint): string {
  return `$${formatUsdc(amount)}`;
}

/**
 * Encrypted salary placeholder
 */
export const SALARY_PLACEHOLDER = '●●●●●';
