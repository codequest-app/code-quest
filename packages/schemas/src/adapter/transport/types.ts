/**
 * Transport-agnostic socket abstraction.
 *
 * Defines the minimal surface that ChannelEmitter / ChannelManager / handlers
 * need. The legacy socket.io Socket, WsTransport's inline ws adapter, and any
 * future Transport implementation MUST satisfy this contract structurally
 * without modification to consumers.
 *
 * Keep this interface minimal — every method added here becomes a transport
 * portability tax. If a method is only used by one site, prefer narrowing
 * there over widening the interface.
 */
export interface TypedSocket {
  /** Stable identifier for the lifetime of one connection (re-issued on reconnect). */
  readonly id: string;
  /** Send an event to this single peer. Dynamic event names are intentional. */
  emit(event: string, ...args: unknown[]): void;
  /** Register a listener. 'disconnect' is the only well-known name; others are protocol events. */
  on(event: string, listener: (...args: unknown[]) => void): void;
}

/** Generic RPC ack callback — accepts any single result argument. */
export type SocketCallback = (result: Record<string, unknown>) => void;
