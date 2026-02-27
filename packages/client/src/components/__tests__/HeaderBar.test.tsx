import { render, screen } from '@testing-library/react';
import { HeaderBar } from '../HeaderBar';

describe('HeaderBar', () => {
  it('shows connected status when connected', () => {
    render(<HeaderBar status="idle" sessionId="abc-123" />);
    expect(screen.getByText(/connected/i)).toBeInTheDocument();
    expect(screen.getByText('abc-123')).toBeInTheDocument();
  });

  it('shows disconnected status', () => {
    render(<HeaderBar status="disconnected" sessionId={null} />);
    expect(screen.getByText(/disconnected/i)).toBeInTheDocument();
  });

  it('shows processing indicator', () => {
    render(<HeaderBar status="processing" sessionId="abc-123" />);
    expect(screen.getByText(/processing/i)).toBeInTheDocument();
  });
});
