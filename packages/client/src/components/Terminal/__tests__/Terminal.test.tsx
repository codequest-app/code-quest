import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Terminal } from '../Terminal';

// Mock xterm
const mockTerminal = {
  loadAddon: vi.fn(),
  open: vi.fn(),
  write: vi.fn(),
  clear: vi.fn(),
  reset: vi.fn(),
  dispose: vi.fn(),
  onData: vi.fn(() => ({ dispose: vi.fn() })),
  onResize: vi.fn(() => ({ dispose: vi.fn() })),
};

const mockFitAddon = {
  fit: vi.fn(),
};

vi.mock('xterm', () => ({
  Terminal: vi.fn(() => mockTerminal),
}));

vi.mock('xterm-addon-fit', () => ({
  FitAddon: vi.fn(() => mockFitAddon),
}));

vi.mock('xterm-addon-web-links', () => ({
  WebLinksAddon: vi.fn(() => ({})),
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

describe('Terminal', () => {
  const defaultProps = {
    sessionId: 'test-session',
    serverUrl: 'http://localhost:3000',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render terminal container', () => {
      render(<Terminal {...defaultProps} />);

      const container = screen.getByTestId('terminal-container');
      expect(container).toBeInTheDocument();
    });

    it('should load FitAddon', () => {
      render(<Terminal {...defaultProps} />);

      expect(mockTerminal.loadAddon).toHaveBeenCalled();
    });

    it('should open terminal in container', () => {
      render(<Terminal {...defaultProps} />);

      expect(mockTerminal.open).toHaveBeenCalled();
    });

    it('should fit terminal on mount', () => {
      render(<Terminal {...defaultProps} />);

      expect(mockFitAddon.fit).toHaveBeenCalled();
    });
  });

  describe('socket integration', () => {
    it('should listen for terminal data', () => {
      render(<Terminal {...defaultProps} />);

      expect(mockSocket.on).toHaveBeenCalledWith(
        'terminal:data',
        expect.any(Function)
      );
    });

    it('should write received data to terminal', () => {
      render(<Terminal {...defaultProps} />);

      // Get the data handler
      const dataHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'terminal:data'
      )?.[1];

      // Simulate receiving data
      dataHandler?.('test-session', 'Hello World');

      expect(mockTerminal.write).toHaveBeenCalledWith('Hello World');
    });

    it('should only write data for matching session', () => {
      render(<Terminal {...defaultProps} />);

      const dataHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'terminal:data'
      )?.[1];

      // Simulate data for different session
      dataHandler?.('other-session', 'Other data');

      // Should not write
      expect(mockTerminal.write).not.toHaveBeenCalledWith('Other data');
    });

    it('should send input to server', () => {
      render(<Terminal {...defaultProps} />);

      // Get the onData handler
      const onDataHandler = mockTerminal.onData.mock.calls[0]?.[0];

      // Simulate user input
      onDataHandler?.('ls\n');

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'terminal:write',
        'test-session',
        'ls\n'
      );
    });

    it('should send resize events to server', () => {
      render(<Terminal {...defaultProps} />);

      // Get the onResize handler
      const onResizeHandler = mockTerminal.onResize.mock.calls[0]?.[0];

      // Simulate resize
      onResizeHandler?.({ cols: 80, rows: 24 });

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'terminal:resize',
        'test-session',
        80,
        24
      );
    });
  });

  describe('lifecycle', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = render(<Terminal {...defaultProps} />);

      unmount();

      expect(mockTerminal.dispose).toHaveBeenCalled();
    });

    it('should clear terminal on session change', () => {
      const { rerender } = render(<Terminal {...defaultProps} />);

      // Clear mock calls from initial render
      mockTerminal.clear.mockClear();

      rerender(<Terminal {...defaultProps} sessionId="new-session" />);

      expect(mockTerminal.clear).toHaveBeenCalled();
    });
  });

  describe('props', () => {
    it('should apply custom className', () => {
      render(<Terminal {...defaultProps} className="custom-class" />);

      const container = screen.getByTestId('terminal-container');
      expect(container).toHaveClass('custom-class');
    });
  });
});
