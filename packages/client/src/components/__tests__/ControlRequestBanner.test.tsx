import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ControlRequestBanner } from '../ControlRequestBanner';

describe('ControlRequestBanner', () => {
  it('renders nothing when no pending control', () => {
    const { container } = render(<ControlRequestBanner pending={null} onRespond={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays tool name and approve/deny buttons', () => {
    render(
      <ControlRequestBanner
        pending={{ requestId: 'r1', subtype: 'tool_approval', toolName: 'bash' }}
        onRespond={vi.fn()}
      />,
    );
    expect(screen.getByText(/bash/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /deny/i })).toBeInTheDocument();
  });

  it('calls onRespond with allowed:true on approve', async () => {
    const onRespond = vi.fn();
    const user = userEvent.setup();
    render(
      <ControlRequestBanner
        pending={{ requestId: 'r1', subtype: 'tool_approval', toolName: 'bash' }}
        onRespond={onRespond}
      />,
    );

    await user.click(screen.getByRole('button', { name: /approve/i }));
    expect(onRespond).toHaveBeenCalledWith({ allowed: true });
  });

  it('calls onRespond with allowed:false on deny', async () => {
    const onRespond = vi.fn();
    const user = userEvent.setup();
    render(
      <ControlRequestBanner
        pending={{ requestId: 'r1', subtype: 'tool_approval', toolName: 'bash' }}
        onRespond={onRespond}
      />,
    );

    await user.click(screen.getByRole('button', { name: /deny/i }));
    expect(onRespond).toHaveBeenCalledWith({ allowed: false });
  });

  it('shows subtype when no toolName', () => {
    render(
      <ControlRequestBanner
        pending={{ requestId: 'r1', subtype: 'permission_request' }}
        onRespond={vi.fn()}
      />,
    );
    expect(screen.getByText(/permission_request/i)).toBeInTheDocument();
  });
});
