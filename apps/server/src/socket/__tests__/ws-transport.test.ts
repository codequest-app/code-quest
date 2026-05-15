import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { TypedSocket } from '@code-quest/schemas';
import type { Envelope } from '@code-quest/transport';
import {
  auth,
  type ConnectionContext,
  type Middleware,
  NullAuthenticator,
  WsTransport,
  wsAdapter,
} from '@code-quest/transport';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocket } from 'ws';

describe('WsTransport (integration)', () => {
  let httpServer: HttpServer;
  let server: WsTransport | undefined;
  let closeServer: (() => Promise<void>) | undefined;
  const clients: WebSocket[] = [];

  function url(path = '/ws'): string {
    const { port } = httpServer.address() as AddressInfo;
    return `ws://127.0.0.1:${port}${path}`;
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
    if (closeServer) {
      await closeServer();
      closeServer = undefined;
    }
    server = undefined;
    await new Promise<void>((r) => httpServer.close(() => r()));
  });

  function createWsTransport(
    handler: (socket: TypedSocket, ctx: ConnectionContext) => void,
    path = '/ws',
    middleware: Middleware[] = [auth(new NullAuthenticator())],
  ): void {
    server = new WsTransport(wsAdapter());
    server.route(path, middleware, handler);
    const handle = server.attach(httpServer);
    closeServer = () => handle.close();
  }

  it('accepts connections and delivers TypedSocket', async () => {
    const accepted: TypedSocket[] = [];
    createWsTransport((s) => accepted.push(s));

    await openClient();
    await vi.waitFor(() => expect(accepted).toHaveLength(1));

    expect(typeof accepted[0]?.id).toBe('string');
    expect(accepted[0]?.id.length).toBeGreaterThan(0);
  });

  it('event envelope emitted via TypedSocket.emit reaches the client with seq', async () => {
    let serverSide: TypedSocket | undefined;
    createWsTransport((s) => {
      serverSide = s;
    });

    const ws = await openClient();
    await vi.waitFor(() => expect(serverSide).toBeDefined());

    const recvP = nextEnvelope(ws);
    serverSide?.emit('hello', { text: 'hi' });
    const env = await recvP;

    expect(env).toEqual({ kind: 'event', seq: 1, event: 'hello', data: { text: 'hi' } });
  });

  it('request envelope routes through handler and response carries matching id', async () => {
    createWsTransport((s) => {
      s.on('list', (...args) => {
        const cb = args[args.length - 1] as (result: unknown) => void;
        if (typeof cb === 'function') cb({ projects: [{ id: 'p-1' }] });
      });
    });

    const ws = await openClient();

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
    createWsTransport(() => {});

    const ws = await openClient();
    const recvP = nextEnvelope(ws);
    ws.send(JSON.stringify({ kind: 'ping' }));
    const env = await recvP;

    expect(env).toEqual({ kind: 'pong' });
  });

  it('malformed JSON frame is dropped without closing the connection', async () => {
    createWsTransport(() => {});

    const ws = await openClient();
    ws.send('not-json');
    const recvP = nextEnvelope(ws);
    ws.send(JSON.stringify({ kind: 'ping' }));
    const env = await recvP;

    expect(env).toEqual({ kind: 'pong' });
    expect(ws.readyState).toBe(ws.OPEN);
  });

  it('TypedSocket disconnect listener fires when client closes', async () => {
    let disconnected = false;
    createWsTransport((s) => {
      s.on('disconnect', () => {
        disconnected = true;
      });
    });

    const ws = await openClient();
    await vi.waitFor(() => expect(disconnected).toBe(false));
    ws.close();
    await vi.waitFor(() => expect(disconnected).toBe(true));
  });

  it('rejects upgrade with HTTP 401 when authenticator returns null', async () => {
    const denyAuth = { authenticate: async () => null };
    createWsTransport(() => {}, '/ws', [auth(denyAuth)]);

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

  it('seq increments per outbound event for each socket independently', async () => {
    const sockets: TypedSocket[] = [];
    createWsTransport((s) => sockets.push(s));

    const wsA = await openClient();
    const wsB = await openClient();
    await vi.waitFor(() => expect(sockets).toHaveLength(2));

    const recvA: Envelope[] = [];
    const recvB: Envelope[] = [];
    wsA.on('message', (raw) => recvA.push(JSON.parse(raw.toString())));
    wsB.on('message', (raw) => recvB.push(JSON.parse(raw.toString())));

    sockets[0]?.emit('e', { n: 1 });
    sockets[0]?.emit('e', { n: 2 });
    sockets[1]?.emit('e', { n: 1 });
    await vi.waitFor(() => {
      expect(recvA).toHaveLength(2);
      expect(recvB).toHaveLength(1);
    });

    expect(recvA.map((e) => (e as { seq: number }).seq)).toEqual([1, 2]);
    expect(recvB.map((e) => (e as { seq: number }).seq)).toEqual([1]);
  });

  it('close stops accepting new connections', async () => {
    createWsTransport(() => {});

    await closeServer?.();
    closeServer = undefined;

    const addr = httpServer.address() as AddressInfo;
    const ws = new WebSocket(`ws://127.0.0.1:${addr.port}/ws`);
    clients.push(ws);
    const outcome = await new Promise<'open' | 'closed'>((resolve) => {
      ws.once('open', () => resolve('open'));
      ws.once('error', () => resolve('closed'));
      ws.once('close', () => resolve('closed'));
      setTimeout(() => resolve('closed'), 300);
    });

    expect(outcome).toBe('closed');
  });

  describe('middleware', () => {
    it('runs middleware in order', async () => {
      const order: string[] = [];
      createWsTransport(
        () => {
          order.push('handler');
        },
        '/ws',
        [
          async (_ctx, next) => {
            order.push('a');
            await next();
          },
          async (_ctx, next) => {
            order.push('b');
            await next();
          },
          async (_ctx, next) => {
            order.push('c');
            await next();
          },
        ],
      );

      await openClient();
      await vi.waitFor(() => expect(order).toEqual(['a', 'b', 'c', 'handler']));
    });

    it('middleware that calls reject stops the pipeline with 401', async () => {
      let handlerCalled = false;
      createWsTransport(
        () => {
          handlerCalled = true;
        },
        '/ws',
        [
          () => {
            // don't call next = reject
          },
        ],
      );

      const ws = new WebSocket(url());
      clients.push(ws);
      const outcome = await new Promise<'open' | 'rejected'>((resolve) => {
        ws.once('open', () => resolve('open'));
        ws.once('error', () => resolve('rejected'));
        ws.once('close', () => resolve('rejected'));
        setTimeout(() => resolve('rejected'), 300);
      });

      expect(outcome).toBe('rejected');
      expect(handlerCalled).toBe(false);
    });
  });

  describe('transformSocket hook', () => {
    it('applies context.transformSocket to wrap the TypedSocket', async () => {
      let receivedSocket: unknown;
      const transform = vi.fn((typed) => {
        const wrapped = { ...typed, id: `wrapped-${typed.id}` };
        return wrapped;
      });

      createWsTransport(
        (socket) => {
          receivedSocket = socket;
        },
        '/ws',
        [
          async (ctx, next) => {
            ctx.transformSocket = transform;
            await next();
          },
        ],
      );

      await openClient();
      await vi.waitFor(() => expect(receivedSocket).toBeDefined());
      expect(transform).toHaveBeenCalledTimes(1);
      expect((receivedSocket as { id: string }).id).toMatch(/^wrapped-/);
    });

    it('uses raw TypedSocket when no transformSocket is set', async () => {
      let receivedSocket: unknown;
      createWsTransport((socket) => {
        receivedSocket = socket;
      });

      await openClient();
      await vi.waitFor(() => expect(receivedSocket).toBeDefined());
      expect((receivedSocket as { id: string }).id).not.toMatch(/^wrapped-/);
    });
  });

  describe('path routing', () => {
    it('routes to correct handler by path', async () => {
      const results: string[] = [];
      server = new WsTransport(wsAdapter());
      server.route('/ws', [], () => {
        results.push('browser');
      });
      server.route('/ws/summoner', [], () => {
        results.push('summoner');
      });
      const handle = server.attach(httpServer);
      closeServer = () => handle.close();

      await openClient(url('/ws'));
      await vi.waitFor(() => expect(results).toContain('browser'));

      await openClient(url('/ws/summoner'));
      await vi.waitFor(() => expect(results).toContain('summoner'));
    });
  });
});
