import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StasisOverlay } from '../StasisOverlay';

describe('StasisOverlay', () => {
  it('renders when visible', () => {
    render(<StasisOverlay visible reason="plan_mode" />);
    expect(screen.getByTestId('stasis-overlay')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    render(<StasisOverlay visible={false} reason="plan_mode" />);
    expect(screen.queryByTestId('stasis-overlay')).not.toBeInTheDocument();
  });

  it('shows 時空凍結 text', () => {
    render(<StasisOverlay visible reason="plan_mode" />);
    expect(screen.getByText('時空凍結')).toBeInTheDocument();
  });

  it('shows reason description for plan_mode', () => {
    render(<StasisOverlay visible reason="plan_mode" />);
    expect(screen.getByText(/思考中/)).toBeInTheDocument();
  });
});
