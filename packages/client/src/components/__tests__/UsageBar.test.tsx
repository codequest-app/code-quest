import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithChannel } from '../../test/render-with-channel';
import { UsageBar } from '../UsageBar';

describe('UsageBar', () => {
  it('renders progress bars for each quota tier', async () => {
    await renderWithChannel(
      <UsageBar
        usage={{
          five_hour: { utilization: 0.3, resets_at: '2026-03-03T10:00:00Z' },
          seven_day: { utilization: 0.6 },
        }}
      />,
    );
    expect(screen.getByTestId('usage-bar')).toBeInTheDocument();
    expect(screen.getByText('5hr')).toBeInTheDocument();
    expect(screen.getByText('7day')).toBeInTheDocument();
  });

  it('uses green for low utilization', async () => {
    await renderWithChannel(<UsageBar usage={{ five_hour: { utilization: 0.3 } }} />);
    const bar = screen.getByTestId('usage-bar-5hr');
    expect(bar.className).toContain('bg-success');
  });

  it('uses yellow for medium utilization', async () => {
    await renderWithChannel(<UsageBar usage={{ five_hour: { utilization: 0.6 } }} />);
    const bar = screen.getByTestId('usage-bar-5hr');
    expect(bar.className).toContain('bg-warning');
  });

  it('uses red for high utilization', async () => {
    await renderWithChannel(<UsageBar usage={{ five_hour: { utilization: 0.9 } }} />);
    const bar = screen.getByTestId('usage-bar-5hr');
    expect(bar.className).toContain('bg-danger');
  });

  it('shows extra usage when enabled', async () => {
    await renderWithChannel(
      <UsageBar
        usage={{
          extra_usage: {
            is_enabled: true,
            utilization: 0.5,
            monthly_limit: 1000,
            used_credits: 500,
          },
        }}
      />,
    );
    expect(screen.getByText('Extra')).toBeInTheDocument();
  });

  it('shows overage badge when overageStatus is active', async () => {
    await renderWithChannel(
      <UsageBar
        usage={{
          extra_usage: {
            is_enabled: true,
            utilization: 0.5,
            overageStatus: 'active',
          },
        }}
      />,
    );
    expect(screen.getByText('Overage')).toBeInTheDocument();
  });

  it('does not show overage badge when overageStatus is absent', async () => {
    await renderWithChannel(
      <UsageBar
        usage={{
          extra_usage: {
            is_enabled: true,
            utilization: 0.5,
          },
        }}
      />,
    );
    expect(screen.queryByText('Overage')).not.toBeInTheDocument();
  });

  it('hides extra usage when not enabled', async () => {
    await renderWithChannel(
      <UsageBar
        usage={{
          extra_usage: { is_enabled: false },
        }}
      />,
    );
    expect(screen.queryByText('Extra')).not.toBeInTheDocument();
  });
});
