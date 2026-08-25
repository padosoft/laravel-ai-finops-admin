import { describe, it, expect } from 'vitest';
import { fmtCompact, fmtDuration, fmtPct, fmtUsd, fmtUsdCompact } from './format';

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

  it('reads a duration the way a human reads one', () => {
    // Compact notation is for counts: it renders nine seconds as "9.0K ms",
    // which is nine seconds written so that nobody notices it is nine seconds.
    expect(fmtDuration(450)).toBe('450 ms');
    expect(fmtDuration(9000)).toBe('9.0 s');
    expect(fmtDuration(125_000)).toBe('2m 5s');
  });

  it('says nothing rather than zero when a duration is missing', () => {
    // A tool with no recorded time is not a tool that took no time.
    expect(fmtDuration(null)).toBe('—');
    expect(fmtDuration(undefined)).toBe('—');
  });
});
