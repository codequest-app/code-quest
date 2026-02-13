import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { WorkerInfo } from '../../../types';
import { WorkerPanel } from '../WorkerPanel';

function makeWorker(id: string, description: string): WorkerInfo {
  return {
    id,
    task: { description, provider: 'claude' },
    status: 'running',
  };
}

describe('WorkerPanel', () => {
  it('should render nothing when no workers', () => {
    const { container } = render(<WorkerPanel workers={[]} />);

    expect(container.innerHTML).toBe('');
  });

  it('should render header with worker count', () => {
    render(<WorkerPanel workers={[makeWorker('w1', 'Task 1'), makeWorker('w2', 'Task 2')]} />);

    expect(screen.getByText('Workers (2)')).toBeInTheDocument();
  });

  it('should render worker cards for each worker', () => {
    render(<WorkerPanel workers={[makeWorker('w1', 'Task 1'), makeWorker('w2', 'Task 2')]} />);

    const cards = screen.getAllByTestId('worker-card');
    expect(cards).toHaveLength(2);
  });

  it('should display worker descriptions', () => {
    render(<WorkerPanel workers={[makeWorker('w1', 'Write tests')]} />);

    expect(screen.getByText('Write tests')).toBeInTheDocument();
  });
});
