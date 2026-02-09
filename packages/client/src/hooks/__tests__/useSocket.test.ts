import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSocket } from '../useSocket';

// Create mock socket instance
const createMockSocket = () => ({
  connected: false,
  on: vi.fn(),
  emit: vi.fn(),
  off: vi.fn(),
  disconnect: vi.fn(),
  connect: vi.fn(),
});

let mockSocket = createMockSocket();

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

describe('useSocket', () => {
  const serverUrl = 'http://localhost:3000';

  beforeEach(() => {
    mockSocket = createMockSocket();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('connection', () => {
    it('should create socket connection on mount', async () => {
      renderHook(() => useSocket(serverUrl));

      // Wait for socket to be created
      await waitFor(() => {
        expect(mockSocket.on).toHaveBeenCalled();
      });

      // Verify connection handlers are registered
      const onCalls = mockSocket.on.mock.calls.map((call: any) => call[0]);
      expect(onCalls).toContain('connect');
      expect(onCalls).toContain('disconnect');
      expect(onCalls).toContain('connect_error');
    });

    it('should return socket instance', async () => {
      const { result } = renderHook(() => useSocket(serverUrl));

      // Socket should be available after hook initialization
      await waitFor(() => {
        expect(mockSocket.on).toHaveBeenCalled();
      });

      // Socket instance exists (may be mock)
      expect(result.current.socket).toBeDefined();
    });

    it('should track connection state', async () => {
      const { result } = renderHook(() => useSocket(serverUrl));

      expect(result.current.isConnected).toBe(false);

      // Simulate connect event
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'connect'
      )?.[1];

      mockSocket.connected = true;
      connectHandler?.();

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
    });

    it('should track disconnection', async () => {
      const { result } = renderHook(() => useSocket(serverUrl));

      // Simulate disconnect event
      const disconnectHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'disconnect'
      )?.[1];

      mockSocket.connected = false;
      disconnectHandler?.();

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
      });
    });

    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useSocket(serverUrl));

      unmount();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('event listeners', () => {
    it('should allow registering event listeners', () => {
      const { result } = renderHook(() => useSocket(serverUrl));

      const callback = vi.fn();
      result.current.on('terminal:created', callback);

      expect(mockSocket.on).toHaveBeenCalledWith('terminal:created', callback);
    });

    it('should allow emitting events', () => {
      const { result } = renderHook(() => useSocket(serverUrl));

      result.current.emit('terminal:create', { cols: 80, rows: 24 });

      expect(mockSocket.emit).toHaveBeenCalledWith('terminal:create', {
        cols: 80,
        rows: 24,
      });
    });

    it('should cleanup listeners on unmount', () => {
      const { result, unmount } = renderHook(() => useSocket(serverUrl));

      const callback = vi.fn();
      result.current.on('terminal:data', callback);

      unmount();

      expect(mockSocket.off).toHaveBeenCalledWith('terminal:data', callback);
    });
  });

  describe('error handling', () => {
    it('should track connection errors', async () => {
      const { result } = renderHook(() => useSocket(serverUrl));

      expect(result.current.error).toBeNull();

      // Simulate connect_error event
      const errorHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'connect_error'
      )?.[1];

      const error = new Error('Connection failed');
      errorHandler?.(error);

      await waitFor(() => {
        expect(result.current.error).toBe('Connection failed');
      });
    });

    it('should clear error on successful connection', async () => {
      const { result } = renderHook(() => useSocket(serverUrl));

      // Set error first
      const errorHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'connect_error'
      )?.[1];
      errorHandler?.(new Error('Failed'));

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      // Simulate successful connection
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'connect'
      )?.[1];

      mockSocket.connected = true;
      connectHandler?.();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('reconnection', () => {
    it('should support manual reconnection', () => {
      const { result } = renderHook(() => useSocket(serverUrl));

      result.current.reconnect();

      expect(mockSocket.connect).toHaveBeenCalled();
    });
  });
});
