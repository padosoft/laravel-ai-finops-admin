import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge, Money, Bar } from './ui';

describe('ui primitives', () => {
  it('StatusBadge maps statuses to tones', () => {
    const { container, rerender } = render(<StatusBadge status="exceeded" />);
    expect(container.querySelector('.badge.red')).toBeTruthy();
    rerender(<StatusBadge status="ok" />);
    expect(container.querySelector('.badge.green')).toBeTruthy();
    rerender(<StatusBadge status="pending" />);
    expect(container.querySelector('.badge.yellow')).toBeTruthy();
  });

  it('Money formats USD', () => {
    render(<Money value={1234.5} />);
    expect(screen.getByText('$1,234.50')).toBeInTheDocument();
  });

  it('Bar clamps width to 0..100', () => {
    const { container } = render(<Bar pct={140} />);
    const span = container.querySelector('.bar > span') as HTMLElement;
    expect(span.style.width).toBe('100%');
  });
});
