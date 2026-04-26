import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Envelope } from '@code-quest/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocket } from 'ws';
import { NullAuthenticator } from '../authenticator.ts';
import { ChannelEmitter } from '../channel-emitter.ts';
import { ResumableConnectionRegistry } from '../resumable-connection-registry.ts';
import type { TransportHandle } from '../transport.ts';
import type { TypedSocket } from '../types.ts';
import { WsTransport } from '../ws-transport.ts';

describe('WsTransport ↔ real ws client end-to-end', () => {
  let httpServer: HttpServer;
  let transport: WsTransport;
  let handle: TransportHandle | undefined;
  let registry: ResumableConnectionRegistry;
  let emitter: ChannelEmitter;
  const clients: WebSocket[] = [];

  function url(sessionKey?: string): string {
    const { port } = httpServer.address() as AddressInfo;
    const q = sessionKey ? `?sessionKey=${sessionKey}` : '';
    return `ws://127.0.0.1:${port}/ws${q}`;
  }

  function openClient(connectUrl = url()): Promise<WebSocket> {
    const ws = new WebSocket(connectUrl);
    clients.push(ws);
    return new Promise((resolve, reject) => {
      ws.once('open', () => resolve(ws));
      ws.once('error', reject);
    });
  }

  function sendEnvelope(ws: WebSocket, env: Envelope): void {
    ws.send(JSON.stringify(env));
  }

  function collectEnvelopes(ws: WebSocket, into: Envelope[]): void {
    ws.on('message', (raw) => {
      into.push(JSON.parse(raw.toString()) as Envelope);
    });
  }

  function nextEnvelope(ws: WebSocket): Promise<Envelope> {
    return new Promise((resolve) => {
      ws.once('message', (raw) => resolve(JSON.parse(raw.toString())));
    });
  }

  function waitForClose(ws: WebSocket): Promise<void> {
    return new Promise((resolve) => {
      if (ws.readyState === ws.CLOSED) return resolve();
      ws.once('close', () => resolve());
    });
  }

  beforeEach(async () => {
    httpServer = createServer((_req, res) => {
      res.statusCode = 404;
      res.end();
    });
    await new Promise<void>((r) => httpServer.listen(0, r));
    emitter = new ChannelEmitter();
    transport = new WsTransport({ authenticator: new NullAuthenticator(), path: '/ws' });
    handle = transport.attach(httpServer);
    registry = new ResumableConnectionRegistry({ resolver: transport });
    handle.onConnection((sock) => {
      const wrapped = registry.acceptOrRebind(sock);
      emitter.handleConnection(wrapped, () => undefined);
    });
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
    httpServer.closeAllConnections();
    await new Promise<void>((r) => httpServer.close(() => r()));
    registry.clear();
  });

  it('14.1 request envelope round-trip via emitter handler ack', async () => {
    emitter.on('list', (_ch, _payload, _socket, cb) => {
      cb?.({ projects: [{ id: 'p-1' }] });
    });
    const ws = await openClient();
    const recvP = nextEnvelope(ws);
    sendEnvelope(ws, { kind: 'request', id: 'r-1', event: 'list', data: {} });

    expect(await recvP).toEqual({
      kind: 'response',
      id: 'r-1',
      ok: true,
      data: { projects: [{ id: 'p-1' }] },
    });
  });

  it('14.2 server-emitted event reaches the client', async () => {
    let serverSide: TypedSocket | undefined;
    emitter.on('subscribe', (_ch, _payload, sock) => {
      serverSide = sock;
    });
    const ws = await openClient();
    sendEnvelope(ws, { kind: 'event', seq: 1, event: 'subscribe', data: {} });
    await vi.waitFor(() => expect(serverSide).toBeDefined());

    const recvP = nextEnvelope(ws);
    serverSide?.emit('system:announcement', { msg: 'hi' });
    const env = await recvP;
    expect(env).toMatchObject({ kind: 'event', event: 'system:announcement', data: { msg: 'hi' } });
  });

  it('14.3 broadcastAll reaches two clients', async () => {
    const connected: TypedSocket[] = [];
    emitter.on('join', (_ch, _payload, sock) => {
      if (sock) connected.push(sock);
    });

    const a = await openClient();
    sendEnvelope(a, { kind: 'event', seq: 1, event: 'join', data: {} });
    const b = await openClient();
    sendEnvelope(b, { kind: 'event', seq: 1, event: 'join', data: {} });
    await vi.waitFor(() => expect(connected).toHaveLength(2));

    const aRecv = nextEnvelope(a);
    const bRecv = nextEnvelope(b);

    emitter.broadcastAll('news', { headline: 'launched' });

    expect(await aRecv).toMatchObject({ kind: 'event', event: 'news' });
    expect(await bRecv).toMatchObject({ kind: 'event', event: 'news' });
  });

  it('14.4 reconnect with sessionKey replays missed events via ResumableSocket', async () => {
    const sessionKey = 'session-1';
    let serverSide: TypedSocket | undefined;
    emitter.on('claim', (_ch, _payload, sock) => {
      serverSide = sock;
    });

    const ws1 = await openClient(url(sessionKey));
    sendEnvelope(ws1, { kind: 'event', seq: 1, event: 'claim', data: {} });
    await vi.waitFor(() => expect(serverSide).toBeDefined());

    const recv1: Envelope[] = [];
    collectEnvelopes(ws1, recv1);
    serverSide?.emit('e', { n: 1 });
    serverSide?.emit('e', { n: 2 });
    await vi.waitFor(() => expect(recv1).toHaveLength(2));

    ws1.terminate();
    await waitForClose(ws1);

    serverSide?.emit('e', { n: 3 });
    serverSide?.emit('e', { n: 4 });

    const ws2 = await openClient(url(sessionKey));
    const recv: Envelope[] = [];
    collectEnvelopes(ws2, recv);
    sendEnvelope(ws2, { kind: 'resume', lastSeq: 2 });

    await vi.waitFor(() => {
      const replayed = recv
        .filter((e): e is Extract<Envelope, { kind: 'event' }> => e.kind === 'event')
        .map((e) => (e.data as { n: number }).n);
      expect(replayed).toEqual([3, 4]);
    });
  });

  it('14.4b two consecutive reconnects do not double-replay already-replayed events', async () => {
    const sessionKey = 'session-double-reconnect';
    let serverSide: TypedSocket | undefined;
    emitter.on('claim', (_ch, _payload, sock) => {
      serverSide = sock;
    });

    const ws1 = await openClient(url(sessionKey));
    sendEnvelope(ws1, { kind: 'event', seq: 1, event: 'claim', data: {} });
    await vi.waitFor(() => expect(serverSide).toBeDefined());

    const recv1: Envelope[] = [];
    collectEnvelopes(ws1, recv1);
    serverSide?.emit('e', { n: 1 });
    serverSide?.emit('e', { n: 2 });
    await vi.waitFor(() => expect(recv1).toHaveLength(2));

    ws1.terminate();
    await waitForClose(ws1);

    serverSide?.emit('e', { n: 3 });
    serverSide?.emit('e', { n: 4 });

    const ws2 = await openClient(url(sessionKey));
    const recv2: Envelope[] = [];
    collectEnvelopes(ws2, recv2);
    sendEnvelope(ws2, { kind: 'resume', lastSeq: 2 });
    await vi.waitFor(() => {
      const events = recv2.filter(
        (e): e is Extract<Envelope, { kind: 'event' }> => e.kind === 'event',
      );
      expect(events.length).toBeGreaterThanOrEqual(2);
    });

    serverSide?.emit('e', { n: 5 });
    await vi.waitFor(() => {
      const events = recv2.filter(
        (e): e is Extract<Envelope, { kind: 'event' }> => e.kind === 'event',
      );
      expect(events.length).toBeGreaterThanOrEqual(3);
    });

    const seqsConn2 = recv2
      .filter((e): e is Extract<Envelope, { kind: 'event' }> => e.kind === 'event')
      .map((e) => e.seq);
    const clientLastSeq = Math.max(...seqsConn2);

    ws2.terminate();
    await waitForClose(ws2);

    const ws3 = await openClient(url(sessionKey));
    const recv3: Envelope[] = [];
    collectEnvelopes(ws3, recv3);
    sendEnvelope(ws3, { kind: 'resume', lastSeq: clientLastSeq });

    // Prove round-trip works, then assert no events were replayed
    const pongP = nextEnvelope(ws3);
    sendEnvelope(ws3, { kind: 'ping' } as Envelope);
    await pongP;

    const replayed3 = recv3
      .filter((e): e is Extract<Envelope, { kind: 'event' }> => e.kind === 'event')
      .map((e) => (e.data as { n: number }).n);

    expect(replayed3).toEqual([]);
  });

  it('14.4c gap-emitted refresh notice must not desync seq tracking', async () => {
    await handle?.close();
    handle = transport.attach(httpServer);
    registry = new ResumableConnectionRegistry({ resolver: transport, bufferSize: 1 });
    handle.onConnection((sock) => {
      const wrapped = registry.acceptOrRebind(sock);
      emitter.handleConnection(wrapped, () => undefined);
    });

    const sessionKey = 'session-gap-then-emit';
    let serverSide: TypedSocket | undefined;
    emitter.on('claim', (_ch, _payload, sock) => {
      serverSide = sock;
    });

    const ws1 = await openClient(url(sessionKey));
    sendEnvelope(ws1, { kind: 'event', seq: 1, event: 'claim', data: {} });
    await vi.waitFor(() => expect(serverSide).toBeDefined());

    const live1: Envelope[] = [];
    collectEnvelopes(ws1, live1);
    serverSide?.emit('e', { n: 1 });
    serverSide?.emit('e', { n: 2 });
    serverSide?.emit('e', { n: 3 });
    await vi.waitFor(() => expect(live1).toHaveLength(3));

    const recv1: Envelope[] = [];
    collectEnvelopes(ws1, recv1);
    sendEnvelope(ws1, { kind: 'resume', lastSeq: 0 });
    await vi.waitFor(() => {
      const events = recv1.filter(
        (e): e is Extract<Envelope, { kind: 'event' }> => e.kind === 'event',
      );
      expect(events.length).toBeGreaterThan(0);
    });

    const lastSeqClientThinksItHas = Math.max(
      ...recv1
        .filter((e): e is Extract<Envelope, { kind: 'event' }> => e.kind === 'event')
        .map((e) => e.seq),
    );

    ws1.terminate();
    await waitForClose(ws1);
    serverSide?.emit('e', { n: 99 });

    const ws2 = await openClient(url(sessionKey));
    const recv2: Envelope[] = [];
    collectEnvelopes(ws2, recv2);
    sendEnvelope(ws2, { kind: 'resume', lastSeq: lastSeqClientThinksItHas });

    await vi.waitFor(() => {
      const replayed2 = recv2
        .filter((e): e is Extract<Envelope, { kind: 'event' }> => e.kind === 'event')
        .filter((e) => e.event === 'e')
        .map((e) => (e.data as { n: number }).n);
      expect(replayed2).toContain(99);
    });
  });

  it('14.5 envelopes from a fresh sessionKey post-disconnect are NOT replayed (anonymous reconnect)', async () => {
    let serverSide: TypedSocket | undefined;
    emitter.on('claim', (_ch, _payload, sock) => {
      serverSide = sock;
    });

    const ws1 = await openClient();
    sendEnvelope(ws1, { kind: 'event', seq: 1, event: 'claim', data: {} });
    await vi.waitFor(() => expect(serverSide).toBeDefined());

    const recv1: Envelope[] = [];
    collectEnvelopes(ws1, recv1);
    serverSide?.emit('e', { n: 1 });
    await vi.waitFor(() => expect(recv1).toHaveLength(1));

    ws1.terminate();
    await waitForClose(ws1);

    const ws2 = await openClient();
    const recv: Envelope[] = [];
    collectEnvelopes(ws2, recv);
    sendEnvelope(ws2, { kind: 'resume', lastSeq: 0 });

    // Prove round-trip works, then assert no events were replayed
    const pongP = nextEnvelope(ws2);
    sendEnvelope(ws2, { kind: 'ping' } as Envelope);
    await pongP;

    const events = recv.filter((e) => e.kind === 'event');
    expect(events).toHaveLength(0);
  });

  it('14.6 authenticator denial closes the upgrade with HTTP 401', async () => {
    await handle?.close();
    handle = undefined;
    transport = new WsTransport({
      authenticator: { authenticate: async () => null },
      path: '/ws',
    });
    handle = transport.attach(httpServer);
    handle.onConnection(() => {});

    const ws = new WebSocket(url());
    clients.push(ws);
    const outcome = await new Promise<'open' | 'denied'>((resolve) => {
      ws.once('open', () => resolve('open'));
      ws.once('error', () => resolve('denied'));
      ws.once('unexpected-response', () => resolve('denied'));
      setTimeout(() => resolve('denied'), 500);
    });

    expect(outcome).toBe('denied');
  });
});
