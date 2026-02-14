import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PhaseHeader } from '../PhaseHeader.tsx';

describe('PhaseHeader', () => {
  it('should show idle status text', () => {
    render(<PhaseHeader status="idle" workers={[]} />);
    expect(screen.getByText('Planning')).toBeInTheDocument();
  });

  it('should show dispatching status text', () => {
    render(<PhaseHeader status="dispatching" workers={[]} />);
    expect(screen.getByText(/Dispatching/)).toBeInTheDocument();
  });

  it('should show workers-running with progress', () => {
    const workers = [
      {
        id: 'w1',
        task: { description: 'A', provider: 'claude' as const },
        status: 'complete' as const,
      },
      {
        id: 'w2',
        task: { description: 'B', provider: 'claude' as const },
        status: 'running' as const,
      },
      {
        id: 'w3',
        task: { description: 'C', provider: 'gemini' as const },
        status: 'running' as const,
      },
    ];
    render(<PhaseHeader status="workers-running" workers={workers} />);
    expect(screen.getByText(/Workers Running/)).toBeInTheDocument();
    expect(screen.getByText('1/3')).toBeInTheDocument();
  });

  it('should show workers-complete status', () => {
    const workers = [
      {
        id: 'w1',
        task: { description: 'A', provider: 'claude' as const },
        status: 'complete' as const,
      },
      {
        id: 'w2',
        task: { description: 'B', provider: 'claude' as const },
        status: 'complete' as const,
      },
    ];
    render(<PhaseHeader status="workers-complete" workers={workers} />);
    expect(screen.getByText(/All Workers Complete/)).toBeInTheDocument();
    expect(screen.getByText('2/2')).toBeInTheDocument();
  });

  it('should show synthesizing status', () => {
    render(<PhaseHeader status="synthesizing" workers={[]} />);
    expect(screen.getByText(/Synthesizing/)).toBeInTheDocument();
  });

  it('should show complete status', () => {
    render(<PhaseHeader status="complete" workers={[]} />);
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('should show merging status text', () => {
    render(<PhaseHeader status="merging" workers={[]} />);
    expect(screen.getByText(/Merging/)).toBeInTheDocument();
  });

  it('should show abort button when merging', () => {
    render(<PhaseHeader status="merging" workers={[]} onAbort={vi.fn()} />);
    expect(screen.getByRole('button', { name: /abort/i })).toBeInTheDocument();
  });

  it('should show error status', () => {
    render(<PhaseHeader status="error" workers={[]} />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('should show abort button when running and call onAbort', async () => {
    const user = userEvent.setup();
    const onAbort = vi.fn();
    render(<PhaseHeader status="workers-running" workers={[]} onAbort={onAbort} />);

    const abortBtn = screen.getByRole('button', { name: /abort/i });
    await user.click(abortBtn);
    expect(onAbort).toHaveBeenCalledTimes(1);
  });

  it('should show abort button when synthesizing', () => {
    render(<PhaseHeader status="synthesizing" workers={[]} onAbort={vi.fn()} />);
    expect(screen.getByRole('button', { name: /abort/i })).toBeInTheDocument();
  });

  it('should not show abort button when idle', () => {
    render(<PhaseHeader status="idle" workers={[]} />);
    expect(screen.queryByRole('button', { name: /abort/i })).not.toBeInTheDocument();
  });

  it('should render progress bar during workers-running', () => {
    const workers = [
      {
        id: 'w1',
        task: { description: 'A', provider: 'claude' as const },
        status: 'complete' as const,
      },
      {
        id: 'w2',
        task: { description: 'B', provider: 'claude' as const },
        status: 'running' as const,
      },
    ];
    render(<PhaseHeader status="workers-running" workers={workers} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
