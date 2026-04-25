import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Envelope } from '@code-quest/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { NullAuthenticator } from '../authenticator.ts';
import type { TransportHandle } from '../transport.ts';
import type { TypedSocket } from '../types.ts';
import { WsTransport } from '../ws-transport.ts';

/**
 * Integration tests for WsTransport. Boots a real http.Server + real WsTransport +
 * real `ws` client. Verifies the Transport contract (onConnection, close, auth gate)
 * AND the envelope wire protocol (event / request / response / ping / pong).
 *
 * Per project TDD discipline: the *real* ws stack is exercised here first.
 * A FakeWsTransport (in-memory) for upper-layer unit tests is extracted in
 * a later task once these integration tests are green.
 */
describe('WsTransport (integration)', () => {
  let httpServer: HttpServer;
  let handle: TransportHandle | undefined;
  const clients: WebSocket[] = [];

  function url(): string {
    const { port } = httpServer.address() as AddressInfo;
    return `ws://127.0.0.1:${port}/ws`;
  }

  function openClient(connectUrl = url()): Promise<WebSocket> {
    const ws = new WebSocket(connectUrl);
    clients.push(ws);
    return new Promise((resolve, reject) => {
      ws.once('open', () => resolve(ws));
      ws.once('error', reject);
    });
  }

  function nextEnvelope(ws: WebSocket): Promise<Envelope> {
    return new Promise((resolve) => {
      ws.once('message', (raw) => resolve(JSON.parse(raw.toString())));
    });
  }

  beforeEach(async () => {
    httpServer = createServer();
    await new Promise<void>((r) => httpServer.listen(0, r));
  });

  afterEach(async () => {
    for (const c of clients) {
      if (c.readyState === c.OPEN || c.readyState === c.CONNECTING) c.close();
    }
    clients.length = 0;
    if (handle) {
      await handle.close();
      handle = undefined;
    }
    await new Promise<void>((r) => httpServer.close(() => r()));
  });

  it('attach mounts on /ws path and accepts connections', async () => {
    const transport = new WsTransport({ authenticator: new NullAuthenticator(), path: '/ws' });
    handle = transport.attach(httpServer);

    const accepted: TypedSocket[] = [];
    handle.onConnection((s) => accepted.push(s));

    await openClient();
    await new Promise<void>((r) => setTimeout(r, 20));

    expect(accepted).toHaveLength(1);
    expect(typeof accepted[0]?.id).toBe('string');
    expect(accepted[0]?.id.length).toBeGreaterThan(0);
  });

  it('event envelope emitted via TypedSocket.emit reaches the client with seq', async () => {
    const transport = new WsTransport({ authenticator: new NullAuthenticator(), path: '/ws' });
    handle = transport.attach(httpServer);

    let serverSide: TypedSocket | undefined;
    handle.onConnection((s) => {
      serverSide = s;
    });

    const ws = await openClient();
    await new Promise<void>((r) => setTimeout(r, 20));
    expect(serverSide).toBeDefined();

    const recvP = nextEnvelope(ws);
    serverSide?.emit('hello', { text: 'hi' });
    const env = await recvP;

    expect(env).toEqual({ kind: 'event', seq: 1, event: 'hello', data: { text: 'hi' } });
  });

  it('a throwing onConnection listener does not block subsequent listeners', async () => {
    const transport = new WsTransport({ authenticator: new NullAuthenticator(), path: '/ws' });
    handle = transport.attach(httpServer);
    let bFired = false;
    handle.onConnection(() => {
      throw new Error('listener boom');
    });
    handle.onConnection(() => {
      bFired = true;
    });

    await openClient();
    await new Promise<void>((r) => setTimeout(r, 30));

    expect(bFired).toBe(true);
  });

  it('request envelope routes through emitter handler and response carries matching id', async () => {
    const transport = new WsTransport({ authenticator: new NullAuthenticator(), path: '/ws' });
    handle = transport.attach(httpServer);

    // Handler returns a raw payload (matches the cc-office convention; many
    // existing handlers do `cb({ projects })`, `cb(project)`, etc., NOT a
    // RpcResult-shaped object). Transport must pass it through transparently
    // — same as socket.io ack semantics.
    handle.onConnection((s) => {
      s.on('list', (...args) => {
        const cb = args[args.length - 1] as (result: unknown) => void;
        if (typeof cb === 'function') cb({ projects: [{ id: 'p-1' }] });
      });
    });

    const ws = await openClient();
    await new Promise<void>((r) => setTimeout(r, 20));

    const reqId = 'req-1';
    const recvP = nextEnvelope(ws);
    ws.send(JSON.stringify({ kind: 'request', id: reqId, event: 'list', data: {} }));
    const env = await recvP;

    expect(env).toEqual({
      kind: 'response',
      id: reqId,
      ok: true,
      data: { projects: [{ id: 'p-1' }] },
    });
  });

  it('client ping envelope receives pong', async () => {
    const transport = new WsTransport({ authenticator: new NullAuthenticator(), path: '/ws' });
    handle = transport.attach(httpServer);
    handle.onConnection(() => {});

    const ws = await openClient();
    const recvP = nextEnvelope(ws);
    ws.send(JSON.stringify({ kind: 'ping' }));
    const env = await recvP;

    expect(env).toEqual({ kind: 'pong' });
  });

  it('malformed JSON frame is dropped without closing the connection', async () => {
    const transport = new WsTransport({ authenticator: new NullAuthenticator(), path: '/ws' });
    handle = transport.attach(httpServer);
    handle.onConnection(() => {});

    const ws = await openClient();
    ws.send('not-json');
    // give server time to (not) close us
    await new Promise<void>((r) => setTimeout(r, 50));

    expect(ws.readyState).toBe(ws.OPEN);
  });

  it('frame failing envelope schema validation is dropped without closing', async () => {
    const transport = new WsTransport({ authenticator: new NullAuthenticator(), path: '/ws' });
    handle = transport.attach(httpServer);
    handle.onConnection(() => {});

    const ws = await openClient();
    ws.send(JSON.stringify({ kind: 'event', seq: -1, event: 'x', data: {} }));
    await new Promise<void>((r) => setTimeout(r, 50));

    expect(ws.readyState).toBe(ws.OPEN);
  });

  it('TypedSocket disconnect listener fires when client closes', async () => {
    const transport = new WsTransport({ authenticator: new NullAuthenticator(), path: '/ws' });
    handle = transport.attach(httpServer);

    let disconnected = false;
    handle.onConnection((s) => {
      s.on('disconnect', () => {
        disconnected = true;
      });
    });

    const ws = await openClient();
    await new Promise<void>((r) => setTimeout(r, 20));
    ws.close();
    await new Promise<void>((r) => setTimeout(r, 50));

    expect(disconnected).toBe(true);
  });

  it('rejects upgrade with HTTP 401 when authenticator returns null', async () => {
    const denyAuth = { authenticate: async () => null };
    const transport = new WsTransport({ authenticator: denyAuth, path: '/ws' });
    handle = transport.attach(httpServer);
    handle.onConnection(() => {});

    const ws = new WebSocket(url());
    clients.push(ws);
    const outcome = await new Promise<'open' | 'error' | 'close'>((resolve) => {
      ws.once('open', () => resolve('open'));
      ws.once('error', () => resolve('error'));
      ws.once('close', () => resolve('close'));
      setTimeout(() => resolve('error'), 1000);
    });

    expect(outcome).not.toBe('open');
  });

  it('close stops accepting new connections without killing the http server', async () => {
    const transport = new WsTransport({ authenticator: new NullAuthenticator(), path: '/ws' });
    handle = transport.attach(httpServer);

    let accepted = 0;
    handle.onConnection(() => {
      accepted++;
    });
    await handle.close();
    handle = undefined;

    // http server still listening — port should still resolve
    const addr = httpServer.address() as AddressInfo;
    expect(addr.port).toBeGreaterThan(0);

    const ws = new WebSocket(`ws://127.0.0.1:${addr.port}/ws`);
    clients.push(ws);
    const outcome = await new Promise<'open' | 'closed'>((resolve) => {
      ws.once('open', () => resolve('open'));
      ws.once('error', () => resolve('closed'));
      ws.once('close', () => resolve('closed'));
      setTimeout(() => resolve('closed'), 300);
    });

    expect(outcome).toBe('closed');
    expect(accepted).toBe(0);
  });

  it('seq increments per outbound event for each socket independently', async () => {
    const transport = new WsTransport({ authenticator: new NullAuthenticator(), path: '/ws' });
    handle = transport.attach(httpServer);

    const sockets: TypedSocket[] = [];
    handle.onConnection((s) => {
      sockets.push(s);
    });

    const wsA = await openClient();
    const wsB = await openClient();
    await new Promise<void>((r) => setTimeout(r, 20));
    expect(sockets).toHaveLength(2);

    const recvA: Envelope[] = [];
    const recvB: Envelope[] = [];
    wsA.on('message', (raw) => recvA.push(JSON.parse(raw.toString())));
    wsB.on('message', (raw) => recvB.push(JSON.parse(raw.toString())));

    sockets[0]?.emit('e', { n: 1 });
    sockets[0]?.emit('e', { n: 2 });
    sockets[1]?.emit('e', { n: 1 });
    await new Promise<void>((r) => setTimeout(r, 30));

    expect(recvA.map((e) => (e as { seq: number }).seq)).toEqual([1, 2]);
    expect(recvB.map((e) => (e as { seq: number }).seq)).toEqual([1]);
  });
});
