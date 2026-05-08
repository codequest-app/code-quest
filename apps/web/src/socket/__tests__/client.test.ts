import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({ id: 'socketio-mock', connected: false })),
}));

vi.mock('../ws-client.ts', () => ({
  WsClient: vi.fn(() => ({})),
}));

vi.mock('../ws-socket-adapter.ts', () => ({
  WsSocketAdapter: vi.fn(() => ({
    id: 'ws-mock',
    connected: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  })),
}));

describe('createSocket', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns ws adapter synchronously when transport is ws', async () => {
    vi.stubEnv('VITE_TRANSPORT', 'ws');
    const { createSocket } = await import('../client.ts');
    const result = createSocket();
    expect(result).not.toBeInstanceOf(Promise);
    expect(result).toHaveProperty('id', 'ws-mock');
  });

  it('returns promise when transport is socketio', async () => {
    vi.stubEnv('VITE_TRANSPORT', 'socketio');
    const { createSocket } = await import('../client.ts');
    const result = createSocket();
    expect(result).toBeInstanceOf(Promise);
    const socket = await result;
    expect(socket).toHaveProperty('id', 'socketio-mock');
  });
});
