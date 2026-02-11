import { useEffect, useState, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { socketManager } from '../services/socket';
import type { ServerToClientEvents, ClientToServerEvents } from '../types';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface UseSocketReturn {
  socket: TypedSocket | null;
  isConnected: boolean;
  error: string | null;
  on: <T extends keyof ServerToClientEvents>(
    event: T,
    callback: ServerToClientEvents[T]
  ) => void;
  emit: <T extends keyof ClientToServerEvents>(
    event: T,
    ...args: Parameters<ClientToServerEvents[T]>
  ) => void;
  reconnect: () => void;
}

/**
 * Custom hook for Socket.io connection management
 * Uses singleton socket manager to prevent multiple connections
 */
export function useSocket(serverUrl: string): UseSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<TypedSocket | null>(null);

  useEffect(() => {
    // Get singleton socket instance
    const socket = socketManager.getSocket(serverUrl);
    socketRef.current = socket;

    // Connection event handlers
    const handleConnect = () => {
      setIsConnected(true);
      setError(null);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleConnectError = (err: Error) => {
      setError(err.message);
      setIsConnected(false);
    };

    // Register event handlers
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // Set initial connection state
    setIsConnected(socket.connected);

    // Cleanup on unmount
    return () => {
      // Only remove event handlers, don't disconnect
      // (socket is shared across components)
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, [serverUrl]);

  /**
   * Register event listener (deprecated - use socket.on directly)
   */
  const on = useCallback(
    <T extends keyof ServerToClientEvents>(
      event: T,
      callback: ServerToClientEvents[T]
    ) => {
      if (!socketRef.current) return;

      socketRef.current.on(event, callback as any);
    },
    []
  );

  /**
   * Emit event to server
   */
  const emit = useCallback(
    <T extends keyof ClientToServerEvents>(
      event: T,
      ...args: Parameters<ClientToServerEvents[T]>
    ) => {
      if (!socketRef.current) return;

      socketRef.current.emit(event, ...args);
    },
    []
  );

  /**
   * Manually reconnect
   */
  const reconnect = useCallback(() => {
    if (!socketRef.current) return;

    socketRef.current.connect();
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    error,
    on,
    emit,
    reconnect,
  };
}
