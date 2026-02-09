import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TerminalTabs } from '../TerminalTabs';

// Mock Terminal component
vi.mock('../../Terminal', () => ({
  Terminal: vi.fn(({ sessionId }) => (
    <div data-testid={`terminal-${sessionId}`}>Terminal {sessionId}</div>
  )),
}));

// Mock useSocket
const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
};

vi.mock('../../../hooks/useSocket', () => ({
  useSocket: vi.fn(() => ({
    socket: mockSocket,
    isConnected: true,
    error: null,
    on: mockSocket.on,
    emit: mockSocket.emit,
    reconnect: vi.fn(),
  })),
}));

// Mock useTerminalStore
const mockStore = {
  sessions: new Map(),
  activeSessionId: null,
  socketState: { connected: true, error: null },
  addSession: vi.fn(),
  removeSession: vi.fn(),
  setActiveSession: vi.fn(),
  setSocketConnected: vi.fn(),
  setSocketError: vi.fn(),
  getSession: vi.fn(),
  getActiveSession: vi.fn(),
  getSessions: vi.fn(() => []),
};

vi.mock('../../../stores/terminalStore', () => ({
  useTerminalStore: vi.fn(() => mockStore),
}));

describe('TerminalTabs', () => {
  const defaultProps = {
    serverUrl: 'http://localhost:3000',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.sessions = new Map();
    mockStore.activeSessionId = null;
    mockStore.getSessions.mockReturnValue([]);
  });

  describe('rendering', () => {
    it('should render tabs container', () => {
      render(<TerminalTabs {...defaultProps} />);

      expect(screen.getByTestId('terminal-tabs')).toBeInTheDocument();
    });

    it('should show new tab button', () => {
      render(<TerminalTabs {...defaultProps} />);

      expect(screen.getByRole('button', { name: /new/i })).toBeInTheDocument();
    });

    it('should show empty state when no tabs', () => {
      render(<TerminalTabs {...defaultProps} />);

      expect(screen.getByText(/no terminals/i)).toBeInTheDocument();
    });
  });

  describe('creating terminals', () => {
    it('should request new terminal on button click', () => {
      render(<TerminalTabs {...defaultProps} />);

      const newButton = screen.getByRole('button', { name: /new/i });
      fireEvent.click(newButton);

      expect(mockSocket.emit).toHaveBeenCalledWith('terminal:create', {});
    });

    it('should add session when terminal:created received', async () => {
      render(<TerminalTabs {...defaultProps} />);

      // Get the terminal:created handler
      const createdHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'terminal:created'
      )?.[1];

      // Simulate terminal created event
      createdHandler?.('session-1', 1234);

      await waitFor(() => {
        expect(mockStore.addSession).toHaveBeenCalledWith('session-1', 1234);
      });
    });
  });

  describe('displaying tabs', () => {
    beforeEach(() => {
      mockStore.getSessions.mockReturnValue([
        { id: 'session-1', pid: 1234, isActive: true, createdAt: 1 },
        { id: 'session-2', pid: 5678, isActive: false, createdAt: 2 },
      ]);
      mockStore.activeSessionId = 'session-1';
    });

    it('should render tabs for all sessions', () => {
      render(<TerminalTabs {...defaultProps} />);

      expect(screen.getByText(/Terminal 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Terminal 2/i)).toBeInTheDocument();
    });

    it('should highlight active tab', () => {
      render(<TerminalTabs {...defaultProps} />);

      const tab1 = screen.getByText(/Terminal 1/i).closest('button');
      const tab2 = screen.getByText(/Terminal 2/i).closest('button');

      expect(tab1).toHaveClass('active');
      expect(tab2).not.toHaveClass('active');
    });

    it('should show close button on each tab', () => {
      render(<TerminalTabs {...defaultProps} />);

      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      expect(closeButtons).toHaveLength(2);
    });
  });

  describe('switching tabs', () => {
    beforeEach(() => {
      mockStore.getSessions.mockReturnValue([
        { id: 'session-1', pid: 1234, isActive: true, createdAt: 1 },
        { id: 'session-2', pid: 5678, isActive: false, createdAt: 2 },
      ]);
      mockStore.activeSessionId = 'session-1';
    });

    it('should switch active tab on click', () => {
      render(<TerminalTabs {...defaultProps} />);

      const tab2 = screen.getByText(/Terminal 2/i);
      fireEvent.click(tab2);

      expect(mockStore.setActiveSession).toHaveBeenCalledWith('session-2');
    });

    it('should not switch if clicking already active tab', () => {
      render(<TerminalTabs {...defaultProps} />);

      const tab1 = screen.getByText(/Terminal 1/i);
      fireEvent.click(tab1);

      expect(mockStore.setActiveSession).not.toHaveBeenCalled();
    });
  });

  describe('closing tabs', () => {
    beforeEach(() => {
      mockStore.getSessions.mockReturnValue([
        { id: 'session-1', pid: 1234, isActive: true, createdAt: 1 },
        { id: 'session-2', pid: 5678, isActive: false, createdAt: 2 },
      ]);
      mockStore.activeSessionId = 'session-1';
    });

    it('should close tab on close button click', () => {
      render(<TerminalTabs {...defaultProps} />);

      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      fireEvent.click(closeButtons[0]);

      expect(mockSocket.emit).toHaveBeenCalledWith('terminal:kill', 'session-1');
    });

    it('should remove session when terminal:exit received', async () => {
      render(<TerminalTabs {...defaultProps} />);

      // Get the terminal:exit handler
      const exitHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'terminal:exit'
      )?.[1];

      // Simulate terminal exit event
      exitHandler?.('session-1', 0);

      await waitFor(() => {
        expect(mockStore.removeSession).toHaveBeenCalledWith('session-1');
      });
    });

    it('should not close tab if event propagation stopped', () => {
      render(<TerminalTabs {...defaultProps} />);

      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      event.stopPropagation = vi.fn();

      fireEvent(closeButtons[0], event);

      // Close button should stop propagation
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('terminal rendering', () => {
    beforeEach(() => {
      mockStore.getSessions.mockReturnValue([
        { id: 'session-1', pid: 1234, isActive: true, createdAt: 1 },
        { id: 'session-2', pid: 5678, isActive: false, createdAt: 2 },
      ]);
      mockStore.activeSessionId = 'session-1';
      mockStore.getActiveSession.mockReturnValue({
        id: 'session-1',
        pid: 1234,
        isActive: true,
        createdAt: 1,
      });
    });

    it('should render active terminal', () => {
      render(<TerminalTabs {...defaultProps} />);

      expect(screen.getByTestId('terminal-session-1')).toBeInTheDocument();
    });

    it('should not render inactive terminals', () => {
      render(<TerminalTabs {...defaultProps} />);

      expect(screen.queryByTestId('terminal-session-2')).not.toBeInTheDocument();
    });

    it('should render no terminal when no active session', () => {
      mockStore.activeSessionId = null;
      mockStore.getActiveSession.mockReturnValue(undefined);

      render(<TerminalTabs {...defaultProps} />);

      expect(screen.queryByTestId(/^terminal-session-/)).not.toBeInTheDocument();
    });
  });

  describe('socket connection state', () => {
    it('should show connected indicator when connected', () => {
      mockStore.socketState = { connected: true, error: null };

      render(<TerminalTabs {...defaultProps} />);

      expect(screen.getByTestId('connection-status')).toHaveTextContent(
        /connected/i
      );
    });

    it('should show disconnected indicator when disconnected', () => {
      mockStore.socketState = { connected: false, error: null };

      render(<TerminalTabs {...defaultProps} />);

      expect(screen.getByTestId('connection-status')).toHaveTextContent(
        /disconnected/i
      );
    });

    it('should show error message when connection error', () => {
      mockStore.socketState = { connected: false, error: 'Connection failed' };

      render(<TerminalTabs {...defaultProps} />);

      expect(screen.getByText(/connection failed/i)).toBeInTheDocument();
    });

    it('should update connection state on socket events', async () => {
      render(<TerminalTabs {...defaultProps} />);

      // Simulate connection
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'connect'
      )?.[1];

      connectHandler?.();

      await waitFor(() => {
        expect(mockStore.setSocketConnected).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('keyboard shortcuts', () => {
    beforeEach(() => {
      mockStore.getSessions.mockReturnValue([
        { id: 'session-1', pid: 1234, isActive: true, createdAt: 1 },
        { id: 'session-2', pid: 5678, isActive: false, createdAt: 2 },
      ]);
      mockStore.activeSessionId = 'session-1';
    });

    it('should create new terminal on Ctrl+T', () => {
      render(<TerminalTabs {...defaultProps} />);

      fireEvent.keyDown(document, { key: 't', ctrlKey: true });

      expect(mockSocket.emit).toHaveBeenCalledWith('terminal:create', {});
    });

    it('should close active terminal on Ctrl+W', () => {
      render(<TerminalTabs {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'w', ctrlKey: true });

      expect(mockSocket.emit).toHaveBeenCalledWith('terminal:kill', 'session-1');
    });
  });
});
