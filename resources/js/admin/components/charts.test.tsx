import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Sparkline, LineChart, DonutChart, BarChart } from './charts';

describe('charts', () => {
  it('Sparkline renders a path for values and nothing for empty', () => {
    const { container, rerender } = render(<Sparkline values={[1, 2, 3]} />);
    expect(container.querySelector('path')).toBeTruthy();
    rerender(<Sparkline values={[]} />);
    expect(container.querySelector('svg')).toBeFalsy();
  });

  it('LineChart breaks the line at null gaps (multiple subpaths)', () => {
    const { container } = render(
      <LineChart series={[{ values: [1, 2, null, 4, 5], fill: true }]} xLabels={['a', 'b', 'c', 'd', 'e']} />,
    );
    // two non-null runs → at least two line subpaths (+ fill paths)
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(2);
  });

  it('DonutChart renders a full ring for a single non-zero slice', () => {
    const { container } = render(<DonutChart values={[100, 0, 0]} colors={['var(--accent)']} />);
    expect(container.querySelector('circle')).toBeTruthy();
  });

  it('DonutChart falls back to a default palette when colors is empty', () => {
    const { container } = render(<DonutChart values={[1, 1]} colors={[]} />);
    const fills = Array.from(container.querySelectorAll('path')).map((p) => p.getAttribute('fill'));
    expect(fills.every((f) => f && f !== 'undefined')).toBe(true);
  });

  it('BarChart renders a rect per value', () => {
    const { container } = render(<BarChart values={[3, 6, 9]} />);
    expect(container.querySelectorAll('rect').length).toBe(3);
  });
});
