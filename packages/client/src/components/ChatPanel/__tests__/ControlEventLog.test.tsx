import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useChatStore } from '../../../stores/chatStore';
import { ControlEventLog } from '../ControlEventLog';

describe('ControlEventLog', () => {
  beforeEach(() => {
    useChatStore.setState({ chatSessions: new Map() });
  });

  it('should not render when no log entries', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    const { container } = render(<ControlEventLog sessionId="s1" />);
    expect(container.innerHTML).toBe('');
  });

  it('should render panel when log entries exist', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    useChatStore.getState().addControlEventLog('s1', {
      direction: 'sent',
      type: 'initialize',
      payload: undefined,
    });

    render(<ControlEventLog sessionId="s1" />);
    expect(screen.getByTestId('control-event-log')).toBeInTheDocument();
  });

  it('should be collapsed by default', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    useChatStore.getState().addControlEventLog('s1', {
      direction: 'sent',
      type: 'initialize',
      payload: undefined,
    });

    render(<ControlEventLog sessionId="s1" />);
    expect(screen.queryByTestId('control-event-log-entries')).not.toBeInTheDocument();
  });

  it('should expand on click and show entries', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    useChatStore.getState().addControlEventLog('s1', {
      direction: 'sent',
      type: 'set_model',
      payload: { model: 'opus' },
    });
    useChatStore.getState().addControlEventLog('s1', {
      direction: 'received',
      type: 'set_model-response',
      payload: { success: true },
    });

    render(<ControlEventLog sessionId="s1" />);
    fireEvent.click(screen.getByTestId('control-event-log-toggle'));

    const entries = screen.getByTestId('control-event-log-entries');
    expect(entries).toBeInTheDocument();
    expect(entries.querySelectorAll('.log-entry')).toHaveLength(2);
  });

  it('should show correct direction arrows', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    useChatStore.getState().addControlEventLog('s1', {
      direction: 'sent',
      type: 'initialize',
      payload: undefined,
    });
    useChatStore.getState().addControlEventLog('s1', {
      direction: 'received',
      type: 'response',
      payload: undefined,
    });

    render(<ControlEventLog sessionId="s1" />);
    fireEvent.click(screen.getByTestId('control-event-log-toggle'));

    const arrows = screen.getAllByTestId('log-direction');
    expect(arrows[0]).toHaveTextContent('\u2192');
    expect(arrows[1]).toHaveTextContent('\u2190');
  });
});
