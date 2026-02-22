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

  const defaultProps = {
    requests: [baseRequest],

    onRespondAll: vi.fn(),
    onDismiss: vi.fn(),
  };

  it('should render subtype and toolName', () => {
    render(<ControlRequestPrompt {...defaultProps} />);

    expect(screen.getByTestId('control-request-prompt')).toBeInTheDocument();
    expect(screen.getByTestId('control-request-subtype')).toHaveTextContent('can_use_tool');
    expect(screen.getByTestId('control-request-tool')).toHaveTextContent('Bash');
  });

  it('should render each request input in details', () => {
    render(<ControlRequestPrompt {...defaultProps} />);

    const details = screen.getByTestId('control-request-details');
    expect(details).toHaveTextContent('ls -la');
  });

  it('should not render toolName when absent', () => {
    const request = { requestId: 'req-002', subtype: 'some_action' };
    render(<ControlRequestPrompt {...defaultProps} requests={[request]} />);

    expect(screen.queryByTestId('control-request-tool')).not.toBeInTheDocument();
  });

  it('should call onRespondAll with allowed: true when Allow is clicked', () => {
    const onRespondAll = vi.fn();
    render(<ControlRequestPrompt {...defaultProps} onRespondAll={onRespondAll} />);

    fireEvent.click(screen.getByTestId('control-btn-allow'));
    expect(onRespondAll).toHaveBeenCalledWith({ behavior: 'allow' });
  });

  it('should call onRespondAll with behavior: deny and onDismiss when Deny is clicked', () => {
    const onRespondAll = vi.fn();
    const onDismiss = vi.fn();
    render(
      <ControlRequestPrompt {...defaultProps} onRespondAll={onRespondAll} onDismiss={onDismiss} />,
    );

    fireEvent.click(screen.getByTestId('control-btn-deny'));
    expect(onRespondAll).toHaveBeenCalledWith({
      behavior: 'deny',
      message: 'User denied this action',
    });
    expect(onDismiss).toHaveBeenCalled();
  });

  describe('multiple requests (same tool)', () => {
    const multiRequests = [
      {
        requestId: 'req-001',
        subtype: 'can_use_tool',
        toolName: 'WebSearch',
        input: { query: 'foo' },
      },
      {
        requestId: 'req-002',
        subtype: 'can_use_tool',
        toolName: 'WebSearch',
        input: { query: 'bar' },
      },
      {
        requestId: 'req-003',
        subtype: 'can_use_tool',
        toolName: 'WebSearch',
        input: { query: 'baz' },
      },
    ];

    it('should show tool name without count', () => {
      render(<ControlRequestPrompt {...defaultProps} requests={multiRequests} />);

      expect(screen.getByTestId('control-request-tool')).toHaveTextContent('WebSearch');
    });

    it('should show all request details', () => {
      render(<ControlRequestPrompt {...defaultProps} requests={multiRequests} />);

      const details = screen.getByTestId('control-request-details');
      expect(details).toHaveTextContent('foo');
      expect(details).toHaveTextContent('bar');
      expect(details).toHaveTextContent('baz');
    });

    it('should call onRespondAll for all requests on Allow', () => {
      const onRespondAll = vi.fn();
      render(
        <ControlRequestPrompt
          {...defaultProps}
          requests={multiRequests}
          onRespondAll={onRespondAll}
        />,
      );

      fireEvent.click(screen.getByTestId('control-btn-allow'));
      expect(onRespondAll).toHaveBeenCalledWith({ behavior: 'allow' });
    });
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
      render(<ControlRequestPrompt {...defaultProps} requests={[requestWithSuggestions]} />);

      expect(screen.getByTestId('control-request-reason')).toHaveTextContent(
        'Path is outside allowed working directories',
      );
    });

    it('should render permission_suggestions as buttons', () => {
      render(<ControlRequestPrompt {...defaultProps} requests={[requestWithSuggestions]} />);

      expect(screen.getByTestId('suggestion-0')).toHaveTextContent('Switch to acceptEdits');
      expect(screen.getByTestId('suggestion-1')).toHaveTextContent('Allow /tmp');
    });

    it('should call onRespondAll with suggestion data when suggestion is clicked', () => {
      const onRespondAll = vi.fn();
      render(
        <ControlRequestPrompt
          {...defaultProps}
          requests={[requestWithSuggestions]}
          onRespondAll={onRespondAll}
        />,
      );

      fireEvent.click(screen.getByTestId('suggestion-0'));
      expect(onRespondAll).toHaveBeenCalledWith({
        behavior: 'allow',
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
      render(<ControlRequestPrompt {...defaultProps} requests={[hookRequest]} />);

      expect(screen.getByTestId('control-request-header')).toHaveTextContent('Hook Callback');
    });

    it('should display hook_event_name', () => {
      render(<ControlRequestPrompt {...defaultProps} requests={[hookRequest]} />);

      expect(screen.getByTestId('control-request-hook-event')).toHaveTextContent('pre-commit');
    });

    it('should display tool_name from input', () => {
      render(<ControlRequestPrompt {...defaultProps} requests={[hookRequest]} />);

      expect(screen.getByTestId('control-request-tool')).toHaveTextContent('Bash');
    });

    it('should call onRespondAll with decision: approve on Allow', () => {
      const onRespondAll = vi.fn();
      render(
        <ControlRequestPrompt
          {...defaultProps}
          requests={[hookRequest]}
          onRespondAll={onRespondAll}
        />,
      );

      fireEvent.click(screen.getByTestId('control-btn-allow'));
      expect(onRespondAll).toHaveBeenCalledWith({ decision: 'approve' });
    });

    it('should call onRespondAll with decision: deny on Deny', () => {
      const onRespondAll = vi.fn();
      const onDismiss = vi.fn();
      render(
        <ControlRequestPrompt
          {...defaultProps}
          requests={[hookRequest]}
          onRespondAll={onRespondAll}
          onDismiss={onDismiss}
        />,
      );

      fireEvent.click(screen.getByTestId('control-btn-deny'));
      expect(onRespondAll).toHaveBeenCalledWith({ decision: 'deny' });
      expect(onDismiss).toHaveBeenCalled();
    });
  });
});
