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

  it('displays model name when provided', () => {
    render(<HeaderBar status="idle" sessionId="s1" model="claude-sonnet-4-20250514" />);
    expect(screen.getByText('claude-sonnet-4-20250514')).toBeInTheDocument();
  });

  it('displays tool count when tools provided', () => {
    render(<HeaderBar status="idle" sessionId="s1" tools={['Read', 'Write', 'Bash']} />);
    expect(screen.getByText(/3 tools/i)).toBeInTheDocument();
  });

  it('does not display model or tools when not provided', () => {
    render(<HeaderBar status="idle" sessionId="s1" />);
    expect(screen.queryByText(/tools/i)).not.toBeInTheDocument();
  });
});
