import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MockWebSocket } from '@/test/mock-websocket';

describe('createSocket', () => {
  let originalWS: typeof globalThis.WebSocket;

  beforeEach(() => {
    originalWS = globalThis.WebSocket;
    MockWebSocket.reset();
    globalThis.WebSocket = MockWebSocket as unknown as typeof globalThis.WebSocket;
    vi.resetModules();
    sessionStorage.clear();
  });

  afterEach(() => {
    globalThis.WebSocket = originalWS;
    vi.unstubAllEnvs();
  });

  it('returns ws adapter synchronously when transport is ws', async () => {
    vi.stubEnv('VITE_TRANSPORT', 'ws');
    const { createSocket } = await import('../client.ts');
    const result = createSocket();
    expect(result).not.toBeInstanceOf(Promise);
  });

  it('returns promise when transport is socketio', async () => {
    vi.stubEnv('VITE_TRANSPORT', 'socketio');
    const { createSocket } = await import('../client.ts');
    // createSocket defers to socket.io-client via dynamic import — just verify it is async
    expect(createSocket()).toBeInstanceOf(Promise);
  });

  describe('sessionKey (ws transport)', () => {
    it('appends sessionKey query param to the WS URL', async () => {
      vi.stubEnv('VITE_TRANSPORT', 'ws');
      const { createSocket } = await import('../client.ts');
      const adapter = createSocket('http://localhost:3000') as { connect(): void };
      adapter.connect();
      const url = MockWebSocket.last()?.url ?? '';
      expect(new URL(url).searchParams.get('sessionKey')).toBeTruthy();
    });

    it('reuses the same sessionKey across calls (reads from sessionStorage)', async () => {
      vi.stubEnv('VITE_TRANSPORT', 'ws');
      const { createSocket } = await import('../client.ts');
      const a1 = createSocket('http://localhost:3000') as { connect(): void };
      a1.connect();
      const key1 = new URL(MockWebSocket.last()!.url).searchParams.get('sessionKey');

      vi.resetModules();
      const { createSocket: createSocket2 } = await import('../client.ts');
      const a2 = createSocket2('http://localhost:3000') as { connect(): void };
      a2.connect();
      const key2 = new URL(MockWebSocket.last()!.url).searchParams.get('sessionKey');

      expect(key1).toBe(key2);
    });

    it('does not open a WebSocket for socketio transport', async () => {
      vi.stubEnv('VITE_TRANSPORT', 'socketio');
      const { createSocket } = await import('../client.ts');
      createSocket('http://localhost:3000');
      expect(MockWebSocket.created()).toBe(0);
    });
  });
});
