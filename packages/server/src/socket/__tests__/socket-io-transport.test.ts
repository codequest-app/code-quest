import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NullAuthenticator } from '../authenticator.ts';
import { SocketIoTransport } from '../socket-io-transport.ts';
import type { TransportHandle } from '../transport.ts';
import type { TypedSocket } from '../types.ts';

// This is an integration test with real socket.io-client. Bypass the global
// vi.mock('socket.io-client') from src/test/setup.ts.
vi.unmock('socket.io-client');
const { io: ioClient } =
  await vi.importActual<typeof import('socket.io-client')>('socket.io-client');
type ClientSocket = ReturnType<typeof ioClient>;

/**
 * Integration tests for SocketIoTransport. Boots a real http.Server + real
 * socket.io Server + real socket.io-client. Verifies the Transport contract
 * (onConnection, close, auth gate) is satisfied by the socket.io adapter.
 */
describe('SocketIoTransport (integration)', () => {
  let httpServer: HttpServer;
  let handle: TransportHandle | undefined;
  const clients: ClientSocket[] = [];

  function url(): string {
    const { port } = httpServer.address() as AddressInfo;
    return `http://127.0.0.1:${port}`;
  }

  beforeEach(async () => {
    httpServer = createServer();
    await new Promise<void>((r) => httpServer.listen(0, r));
  });

  afterEach(async () => {
    for (const c of clients) c.disconnect();
    clients.length = 0;
    if (handle) {
      await handle.close();
      handle = undefined;
    }
    await new Promise<void>((r) => httpServer.close(() => r()));
  });

  it('attach mounts transport on the http server and accepts connections', async () => {
    const transport = new SocketIoTransport({ authenticator: new NullAuthenticator() });
    handle = transport.attach(httpServer);

    const accepted: TypedSocket[] = [];
    handle.onConnection((s) => accepted.push(s));

    const c = ioClient(url(), { transports: ['websocket'] });
    clients.push(c);
    await new Promise<void>((r) => c.on('connect', () => r()));

    expect(accepted).toHaveLength(1);
    expect(typeof accepted[0]?.id).toBe('string');
    expect(accepted[0]?.id.length).toBeGreaterThan(0);
  });

  it('TypedSocket produced by transport supports emit and on', async () => {
    const transport = new SocketIoTransport({ authenticator: new NullAuthenticator() });
    handle = transport.attach(httpServer);

    let serverSide: TypedSocket | undefined;
    handle.onConnection((s) => {
      serverSide = s;
      s.on('hello', (...args) => {
        const payload = args[0] as { text: string };
        s.emit('reply', { echo: payload.text });
      });
    });

    const c = ioClient(url(), { transports: ['websocket'] });
    clients.push(c);
    await new Promise<void>((r) => c.on('connect', () => r()));
    expect(serverSide).toBeDefined();

    const reply = await new Promise<{ echo: string }>((resolve) => {
      c.on('reply', (data) => resolve(data));
      c.emit('hello', { text: 'hi' });
    });

    expect(reply).toEqual({ echo: 'hi' });
  });

  it('a throwing onConnection listener does not block subsequent listeners', async () => {
    const transport = new SocketIoTransport({ authenticator: new NullAuthenticator() });
    handle = transport.attach(httpServer);
    let bFired = false;
    handle.onConnection(() => {
      throw new Error('listener boom');
    });
    handle.onConnection(() => {
      bFired = true;
    });

    const c = ioClient(url(), { transports: ['websocket'] });
    clients.push(c);
    await new Promise<void>((r) => c.on('connect', () => r()));

    expect(bFired).toBe(true);
  });

  it('multiple onConnection listeners all fire for one connection', async () => {
    const transport = new SocketIoTransport({ authenticator: new NullAuthenticator() });
    handle = transport.attach(httpServer);

    let aFired = 0;
    let bFired = 0;
    handle.onConnection(() => {
      aFired++;
    });
    handle.onConnection(() => {
      bFired++;
    });

    const c = ioClient(url(), { transports: ['websocket'] });
    clients.push(c);
    await new Promise<void>((r) => c.on('connect', () => r()));

    expect(aFired).toBe(1);
    expect(bFired).toBe(1);
  });

  it('close stops accepting new connections', async () => {
    const transport = new SocketIoTransport({ authenticator: new NullAuthenticator() });
    handle = transport.attach(httpServer);

    let accepted = 0;
    handle.onConnection(() => {
      accepted++;
    });
    await handle.close();
    handle = undefined;

    const c = ioClient(url(), {
      transports: ['websocket'],
      reconnection: false,
      timeout: 200,
    });
    clients.push(c);
    await new Promise<void>((resolve) => {
      c.on('connect', () => resolve());
      c.on('connect_error', () => resolve());
      setTimeout(() => resolve(), 300);
    });

    expect(accepted).toBe(0);
  });

  it('rejects connection when authenticator returns null', async () => {
    const denyAuth = { authenticate: async () => null };
    const transport = new SocketIoTransport({ authenticator: denyAuth });
    handle = transport.attach(httpServer);

    let accepted = 0;
    handle.onConnection(() => {
      accepted++;
    });

    const c = ioClient(url(), {
      transports: ['websocket'],
      reconnection: false,
      timeout: 500,
    });
    clients.push(c);

    const outcome = await new Promise<'connect' | 'error'>((resolve) => {
      c.on('connect', () => resolve('connect'));
      c.on('connect_error', () => resolve('error'));
      setTimeout(() => resolve('error'), 700);
    });

    expect(outcome).toBe('error');
    expect(accepted).toBe(0);
  });
});
