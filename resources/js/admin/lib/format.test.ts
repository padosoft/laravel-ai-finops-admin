import { describe, it, expect } from 'vitest';
import { fmtUsd, fmtUsdCompact, fmtCompact, fmtPct } from './format';

describe('format', () => {
  it('formats USD with 2 decimals', () => {
    expect(fmtUsd(1234.5)).toBe('$1,234.50');
  });

  it('formats compact USD', () => {
    expect(fmtUsdCompact(1500)).toBe('$1.5K');
    expect(fmtUsdCompact(2_400_000)).toBe('$2.40M');
  });

  it('formats compact numbers', () => {
    expect(fmtCompact(2_500_000)).toBe('2.50M');
    expect(fmtCompact(1500)).toBe('1.5K');
  });

  it('formats percent with sign', () => {
    expect(fmtPct(12.4)).toBe('+12.4%');
    expect(fmtPct(-3)).toBe('-3.0%');
  });
});
