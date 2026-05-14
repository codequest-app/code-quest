import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// biome-ignore lint/complexity/useArrowFunction: vitest v4 requires regular functions for mocks used with `new`
const MockWsClient = vi.fn(function () {});

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({ id: 'socketio-mock', connected: false })),
}));

vi.mock('../ws-client.ts', () => ({
  WsClient: MockWsClient,
}));

vi.mock('../ws-socket-adapter.ts', () => ({
  // biome-ignore lint/complexity/useArrowFunction: vitest v4 requires regular functions for mocks used with `new`
  WsSocketAdapter: vi.fn(function () {
    return {
      id: 'ws-mock',
      connected: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    };
  }),
}));

describe('createSocket', () => {
  beforeEach(() => {
    vi.resetModules();
    sessionStorage.clear();
    MockWsClient.mockClear();
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

  describe('sessionKey (ws transport)', () => {
    function getCalledUrl(): string {
      const calls = MockWsClient.mock.calls as unknown as string[][];
      return calls[0]![0]!;
    }

    it('appends sessionKey query param to the WS URL', async () => {
      vi.stubEnv('VITE_TRANSPORT', 'ws');
      const { createSocket } = await import('../client.ts');
      createSocket('http://localhost:3000');
      expect(new URL(getCalledUrl()).searchParams.get('sessionKey')).toBeTruthy();
    });

    it('reuses the same sessionKey across calls (reads from sessionStorage)', async () => {
      vi.stubEnv('VITE_TRANSPORT', 'ws');
      const { createSocket } = await import('../client.ts');
      createSocket('http://localhost:3000');
      const key1 = new URL(getCalledUrl()).searchParams.get('sessionKey');

      vi.resetModules();
      MockWsClient.mockClear();
      const { createSocket: createSocket2 } = await import('../client.ts');
      createSocket2('http://localhost:3000');
      const key2 = new URL(getCalledUrl()).searchParams.get('sessionKey');

      expect(key1).toBe(key2);
    });

    it('does not append sessionKey for socketio transport', async () => {
      vi.stubEnv('VITE_TRANSPORT', 'socketio');
      const { createSocket } = await import('../client.ts');
      await createSocket('http://localhost:3000');
      expect(MockWsClient).not.toHaveBeenCalled();
    });
  });
});
