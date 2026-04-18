import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePreferencesStore } from '../../stores/usePreferencesStore';
import { SettingsDialog } from '../SettingsDialog';

function resetStore() {
  localStorage.clear();
  usePreferencesStore.setState({
    colorTheme: 'dark',
    fontSize: 'md',
    density: 'comfortable',
    layout: 'a',
    hiddenItems: [],
    isOnboardingDismissed: false,
    isReviewUpsellDismissed: false,
  });
}

describe('SettingsDialog', () => {
  beforeEach(() => {
    resetStore();
  });

  it('shows live-save hint', () => {
    render(<SettingsDialog open={true} onClose={vi.fn()} />);
    expect(
      screen.getByText(/Changes apply instantly and are saved automatically/i),
    ).toBeInTheDocument();
  });

  it('reflects current store values as selected radios', () => {
    usePreferencesStore.setState({ colorTheme: 'light', fontSize: 'lg', density: 'compact' });
    render(<SettingsDialog open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Large' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Compact' })).toBeChecked();
  });

  it('clicking fontSize=Large updates store', async () => {
    const user = userEvent.setup();
    render(<SettingsDialog open={true} onClose={vi.fn()} />);
    await user.click(screen.getByRole('radio', { name: 'Large' }));
    expect(usePreferencesStore.getState().fontSize).toBe('lg');
  });

  it('clicking Light theme updates store', async () => {
    const user = userEvent.setup();
    render(<SettingsDialog open={true} onClose={vi.fn()} />);
    await user.click(screen.getByRole('radio', { name: 'Light' }));
    expect(usePreferencesStore.getState().colorTheme).toBe('light');
  });

  it('clicking Compact density updates store', async () => {
    const user = userEvent.setup();
    render(<SettingsDialog open={true} onClose={vi.fn()} />);
    await user.click(screen.getByRole('radio', { name: 'Compact' }));
    expect(usePreferencesStore.getState().density).toBe('compact');
  });

  it('clicking Close calls onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<SettingsDialog open={true} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render when closed', () => {
    render(<SettingsDialog open={false} onClose={vi.fn()} />);
    expect(screen.queryByText(/Changes apply instantly/i)).not.toBeInTheDocument();
  });
});
