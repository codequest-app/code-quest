import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../types';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Singleton Socket Manager
 * Ensures only one socket connection exists throughout the app lifecycle
 */
class SocketManager {
  private socket: TypedSocket | null = null;
  private serverUrl: string | null = null;

  /**
   * Get or create socket instance
   */
  getSocket(serverUrl: string): TypedSocket {
    // If socket exists and URLs match, return existing socket
    if (this.socket && this.serverUrl === serverUrl) {
      return this.socket;
    }

    // Disconnect old socket if URL changed
    if (this.socket && this.serverUrl !== serverUrl) {
      this.socket.disconnect();
    }

    // Create new socket
    this.socket = io(serverUrl, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    }) as TypedSocket;

    this.serverUrl = serverUrl;

    return this.socket;
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.serverUrl = null;
    }
  }
}

// Export singleton instance
export const socketManager = new SocketManager();
