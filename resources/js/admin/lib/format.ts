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

export const fmtPct = (n: number, decimals = 1): string => (n >= 0 ? '+' : '') + n.toFixed(decimals) + '%';

export const fmtNum = (n: number): string => Number(n).toLocaleString('en-US');
