import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ControlRequestPrompt } from '../ControlRequestPrompt';

describe('ControlRequestPrompt', () => {
  const baseRequest = {
    requestId: 'req-001',
    subtype: 'can_use_tool',
    toolName: 'Bash',
    input: { command: 'ls -la' },
  };

  it('should render subtype and toolName', () => {
    render(<ControlRequestPrompt request={baseRequest} onRespond={vi.fn()} onDismiss={vi.fn()} />);

    expect(screen.getByTestId('control-request-prompt')).toBeInTheDocument();
    expect(screen.getByTestId('control-request-subtype')).toHaveTextContent('can_use_tool');
    expect(screen.getByTestId('control-request-tool')).toHaveTextContent('Bash');
  });

  it('should render input summary', () => {
    render(<ControlRequestPrompt request={baseRequest} onRespond={vi.fn()} onDismiss={vi.fn()} />);

    expect(screen.getByTestId('control-request-input')).toHaveTextContent('ls -la');
  });

  it('should not render toolName when absent', () => {
    const request = { requestId: 'req-002', subtype: 'some_action' };
    render(<ControlRequestPrompt request={request} onRespond={vi.fn()} onDismiss={vi.fn()} />);

    expect(screen.queryByTestId('control-request-tool')).not.toBeInTheDocument();
  });

  it('should call onRespond with allowed: true when Allow is clicked', () => {
    const onRespond = vi.fn();
    render(
      <ControlRequestPrompt request={baseRequest} onRespond={onRespond} onDismiss={vi.fn()} />,
    );

    fireEvent.click(screen.getByLabelText('Allow'));
    expect(onRespond).toHaveBeenCalledWith('req-001', { allowed: true });
  });

  it('should call onRespond with allowed: false and onDismiss when Deny is clicked', () => {
    const onRespond = vi.fn();
    const onDismiss = vi.fn();
    render(
      <ControlRequestPrompt request={baseRequest} onRespond={onRespond} onDismiss={onDismiss} />,
    );

    fireEvent.click(screen.getByLabelText('Deny'));
    expect(onRespond).toHaveBeenCalledWith('req-001', { allowed: false });
    expect(onDismiss).toHaveBeenCalled();
  });

  describe('permission_suggestions', () => {
    const requestWithSuggestions = {
      requestId: 'req-003',
      subtype: 'can_use_tool',
      toolName: 'Bash',
      input: {
        command: 'rm -rf /tmp/stuff',
        decision_reason: 'Path is outside allowed working directories',
        permission_suggestions: [
          { type: 'setMode', mode: 'acceptEdits', destination: 'session' },
          { type: 'addDirectories', directories: ['/tmp'], destination: 'session' },
        ],
      },
    };

    it('should display decision_reason', () => {
      render(
        <ControlRequestPrompt
          request={requestWithSuggestions}
          onRespond={vi.fn()}
          onDismiss={vi.fn()}
        />,
      );

      expect(screen.getByTestId('control-request-reason')).toHaveTextContent(
        'Path is outside allowed working directories',
      );
    });

    it('should render permission_suggestions as buttons', () => {
      render(
        <ControlRequestPrompt
          request={requestWithSuggestions}
          onRespond={vi.fn()}
          onDismiss={vi.fn()}
        />,
      );

      expect(screen.getByTestId('suggestion-0')).toHaveTextContent('Switch to acceptEdits');
      expect(screen.getByTestId('suggestion-1')).toHaveTextContent('Allow /tmp');
    });

    it('should call onRespond with suggestion data when suggestion is clicked', () => {
      const onRespond = vi.fn();
      render(
        <ControlRequestPrompt
          request={requestWithSuggestions}
          onRespond={onRespond}
          onDismiss={vi.fn()}
        />,
      );

      fireEvent.click(screen.getByTestId('suggestion-0'));
      expect(onRespond).toHaveBeenCalledWith('req-003', {
        allowed: true,
        type: 'setMode',
        mode: 'acceptEdits',
        destination: 'session',
      });
    });
  });

  describe('hook_callback', () => {
    const hookRequest = {
      requestId: 'req-004',
      subtype: 'hook_callback',
      input: {
        hook_event_name: 'pre-commit',
        tool_name: 'Bash',
      },
    };

    it('should display Hook Callback header', () => {
      render(
        <ControlRequestPrompt request={hookRequest} onRespond={vi.fn()} onDismiss={vi.fn()} />,
      );

      expect(screen.getByTestId('control-request-header')).toHaveTextContent('Hook Callback');
    });

    it('should display hook_event_name', () => {
      render(
        <ControlRequestPrompt request={hookRequest} onRespond={vi.fn()} onDismiss={vi.fn()} />,
      );

      expect(screen.getByTestId('control-request-hook-event')).toHaveTextContent('pre-commit');
    });

    it('should display tool_name from input', () => {
      render(
        <ControlRequestPrompt request={hookRequest} onRespond={vi.fn()} onDismiss={vi.fn()} />,
      );

      expect(screen.getByTestId('control-request-tool')).toHaveTextContent('Bash');
    });

    it('should call onRespond with decision: approve on Allow', () => {
      const onRespond = vi.fn();
      render(
        <ControlRequestPrompt request={hookRequest} onRespond={onRespond} onDismiss={vi.fn()} />,
      );

      fireEvent.click(screen.getByLabelText('Allow'));
      expect(onRespond).toHaveBeenCalledWith('req-004', { decision: 'approve' });
    });

    it('should call onRespond with decision: deny on Deny', () => {
      const onRespond = vi.fn();
      const onDismiss = vi.fn();
      render(
        <ControlRequestPrompt request={hookRequest} onRespond={onRespond} onDismiss={onDismiss} />,
      );

      fireEvent.click(screen.getByLabelText('Deny'));
      expect(onRespond).toHaveBeenCalledWith('req-004', { decision: 'deny' });
      expect(onDismiss).toHaveBeenCalled();
    });
  });
});
