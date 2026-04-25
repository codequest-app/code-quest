import type { IncomingMessage } from 'node:http';

/**
 * Authentication context attached to a TypedSocket after a successful handshake.
 * Concrete fields are intentionally minimal; transports MUST NOT inspect.
 */
export interface AuthContext {
  /** Stable user identifier. For single-user environments use 'anon' or similar. */
  readonly userId: string;
}

/**
 * Authenticator validates a Node http upgrade request and returns the AuthContext
 * to attach to the resulting TypedSocket — or null to reject the handshake.
 *
 * Implementations should be transport-agnostic: the same Authenticator instance
 * MUST work for both SocketIoTransport (called via io.use()) and WsTransport
 * (called from the upgrade handler).
 */
export interface Authenticator {
  authenticate(req: IncomingMessage): Promise<AuthContext | null>;
}

/**
 * NullAuthenticator — always accepts with userId='anon'.
 *
 * Default for cc-office's current single-user mode. Replace with a real
 * authenticator when multi-user support lands.
 */
export class NullAuthenticator implements Authenticator {
  constructor(private readonly userId: string = 'anon') {}
  async authenticate(_req: IncomingMessage): Promise<AuthContext | null> {
    return { userId: this.userId };
  }
}
