import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastProvider, useToast } from './Toast';

function Trigger() {
  const toast = useToast();
  return (
    <button onClick={() => toast('Saved', { kind: 'success' })}>fire</button>
  );
}

describe('Toast', () => {
  it('pushes a toast into the stack', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText('fire'));
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });
});
