export const fmtUsd = (n: number, decimals = 2): string =>
  '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export const fmtUsdCompact = (n: number): string => {
  if (Math.abs(n) >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
  if (Math.abs(n) >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
  return '$' + n.toFixed(2);
};

export const fmtCompact = (n: number): string => {
  if (Math.abs(n) >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
};

/**
 * A wall-clock duration in milliseconds, read the way a human reads it. Compact
 * notation is for counts: "9.0K ms" is nine seconds written so that nobody
 * notices it is nine seconds.
 */
export const fmtDuration = (ms: number | null | undefined): string => {
  if (ms === null || ms === undefined) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  const minutes = Math.floor(ms / 60_000);
  return `${minutes}m ${Math.round((ms % 60_000) / 1000)}s`;
};

export const fmtPct = (n: number, decimals = 1): string => (n >= 0 ? '+' : '') + n.toFixed(decimals) + '%';

export const fmtNum = (n: number): string => Number(n).toLocaleString('en-US');
