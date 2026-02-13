import type { WorkerInfo } from '@code-quest/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WorkerCard } from '../WorkerCard';

function makeWorker(overrides: Partial<WorkerInfo> = {}): WorkerInfo {
  return {
    id: 'w1',
    task: { description: 'Write tests', provider: 'claude' },
    status: 'running',
    ...overrides,
  };
}

describe('WorkerCard', () => {
  it('should render task description', () => {
    render(<WorkerCard worker={makeWorker()} />);

    expect(screen.getByText('Write tests')).toBeInTheDocument();
  });

  it('should render provider label for claude', () => {
    render(<WorkerCard worker={makeWorker({ task: { description: 'x', provider: 'claude' } })} />);

    expect(screen.getByText('Claude')).toBeInTheDocument();
  });

  it('should render provider label for gemini', () => {
    render(<WorkerCard worker={makeWorker({ task: { description: 'x', provider: 'gemini' } })} />);

    expect(screen.getByText('Gemini')).toBeInTheDocument();
  });

  it('should set data-status attribute', () => {
    render(<WorkerCard worker={makeWorker({ status: 'complete' })} />);

    expect(screen.getByTestId('worker-card')).toHaveAttribute('data-status', 'complete');
  });

  it('should show preview text from result', () => {
    render(<WorkerCard worker={makeWorker({ result: 'Partial output...' })} />);

    expect(screen.getByTestId('worker-preview')).toBeInTheDocument();
    expect(screen.getByText('Partial output...')).toBeInTheDocument();
  });

  it('should truncate preview at 120 characters', () => {
    const longResult = 'A'.repeat(200);
    render(<WorkerCard worker={makeWorker({ result: longResult })} />);

    expect(screen.getByTestId('worker-preview').textContent).toHaveLength(120);
  });

  it('should show error text on error status', () => {
    render(<WorkerCard worker={makeWorker({ status: 'error', error: 'Something went wrong' })} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should show "Unknown error" when error status but no error message', () => {
    render(<WorkerCard worker={makeWorker({ status: 'error' })} />);

    expect(screen.getByText('Unknown error')).toBeInTheDocument();
  });

  it('should not show preview when no result', () => {
    render(<WorkerCard worker={makeWorker({ result: undefined })} />);

    expect(screen.queryByTestId('worker-preview')).not.toBeInTheDocument();
  });

  it('should show stats when present', () => {
    render(
      <WorkerCard
        worker={makeWorker({
          status: 'complete',
          stats: { costUsd: 0.005, durationMs: 2000 },
        })}
      />,
    );

    expect(screen.getByText(/\$0\.0050/)).toBeInTheDocument();
    expect(screen.getByText(/2\.0s/)).toBeInTheDocument();
  });

  it('should render status icon', () => {
    render(<WorkerCard worker={makeWorker({ status: 'complete' })} />);

    expect(screen.getByTestId('worker-status-icon')).toBeInTheDocument();
  });
});
