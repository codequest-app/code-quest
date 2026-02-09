import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
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
 */
export function useSocket(serverUrl: string): UseSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<TypedSocket | null>(null);
  const listenersRef = useRef<Map<string, Function>>(new Map());

  useEffect(() => {
    // Create socket connection
    const socket = io(serverUrl, {
      transports: ['websocket'],
      autoConnect: true,
    }) as TypedSocket;

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

    // Cleanup on unmount
    return () => {
      // Remove all custom listeners
      listenersRef.current.forEach((callback, event) => {
        socket.off(event, callback as any);
      });
      listenersRef.current.clear();

      // Remove connection handlers
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);

      // Disconnect socket
      socket.disconnect();
    };
  }, [serverUrl]);

  /**
   * Register event listener
   */
  const on = useCallback(
    <T extends keyof ServerToClientEvents>(
      event: T,
      callback: ServerToClientEvents[T]
    ) => {
      if (!socketRef.current) return;

      socketRef.current.on(event, callback as any);
      listenersRef.current.set(event as string, callback);
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
