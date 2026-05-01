import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { usePreferencesStore } from '@/stores/usePreferencesStore';
import { OnboardingOverlay } from '../OnboardingOverlay';

describe('OnboardingOverlay', () => {
  beforeEach(() => {
    usePreferencesStore.setState({ hiddenItems: [] });
  });

  it('renders first step by default', () => {
    render(<OnboardingOverlay />);
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
  });

  it('returns null when dismissed', () => {
    usePreferencesStore.setState({ hiddenItems: ['onboarding-overlay'] });
    const { container } = render(<OnboardingOverlay />);
    expect(container.innerHTML).toBe('');
  });

  it('navigates through steps with Next', async () => {
    const user = userEvent.setup();
    render(<OnboardingOverlay />);
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText('Open Chat')).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
  });

  it('navigates back with Back button', async () => {
    const user = userEvent.setup();
    render(<OnboardingOverlay />);
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText('Welcome')).toBeInTheDocument();
  });

  it('dismisses when Skip is clicked', async () => {
    const user = userEvent.setup();
    render(<OnboardingOverlay />);
    await user.click(screen.getByRole('button', { name: /skip/i }));
    expect(usePreferencesStore.getState().hiddenItems).toContain('onboarding-overlay');
  });

  it('dismisses when Done is clicked on last step', async () => {
    const user = userEvent.setup();
    render(<OnboardingOverlay />);
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /done/i }));
    expect(usePreferencesStore.getState().hiddenItems).toContain('onboarding-overlay');
  });

  it('disables Back button on first step', () => {
    render(<OnboardingOverlay />);
    expect(screen.getByRole('button', { name: /back/i })).toBeDisabled();
  });
});
