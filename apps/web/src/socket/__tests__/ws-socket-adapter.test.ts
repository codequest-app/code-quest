import { WsClient } from '@code-quest/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MockWebSocket } from '@/test/mock-websocket';
import { WsSocketAdapter } from '../ws-socket-adapter.ts';

/**
 * The adapter exposes a socket.io-Socket-shaped API on top of WsClient so
 * that consumer hooks / contexts (which were written for socket.io) can run
 * unchanged once VITE_TRANSPORT=ws is selected. Surface tested here matches
 * the parts of socket.io's Socket the codebase actually relies on.
 */
describe('WsSocketAdapter', () => {
  let originalWS: typeof globalThis.WebSocket;

  beforeEach(() => {
    originalWS = globalThis.WebSocket;
    MockWebSocket.reset();
    globalThis.WebSocket = MockWebSocket as unknown as typeof globalThis.WebSocket;
  });

  afterEach(() => {
    globalThis.WebSocket = originalWS;
    vi.useRealTimers();
  });

  function setupConnected() {
    const client = new WsClient('ws://x/ws');
    const adapter = new WsSocketAdapter(client);
    adapter.connect();
    const ws = MockWebSocket.last()!;
    ws.acceptOpen();
    return { adapter, ws };
  }

  it('connect transitions connected from false to true and fires "connect"', () => {
    const client = new WsClient('ws://x/ws');
    const adapter = new WsSocketAdapter(client);
    const onConnect = vi.fn();
    adapter.on('connect', onConnect);

    expect(adapter.connected).toBe(false);
    adapter.connect();
    const ws = MockWebSocket.last()!;
    ws.acceptOpen();

    expect(adapter.connected).toBe(true);
    expect(onConnect).toHaveBeenCalled();
  });

  it('disconnect transitions connected to false', () => {
    const { adapter, ws } = setupConnected();
    adapter.disconnect();
    expect(adapter.connected).toBe(false);
    expect(ws.readyState).toBe(MockWebSocket.CLOSED);
  });

  it('emit without callback sends a fire-and-forget event envelope', () => {
    const { adapter, ws } = setupConnected();
    ws.clearSent();

    adapter.emit('chat:send', { text: 'hi' });

    const env = ws.lastSentEnvelope() as { kind: string; event: string; data: unknown };
    expect(env).toMatchObject({ kind: 'event', event: 'chat:send', data: { text: 'hi' } });
  });

  it('emit with callback receives the raw response payload (socket.io-transparent)', async () => {
    // Real code-quest consumers do `socket.emit(event, payload, (res) => { res.projects... })`
    // — the ack value is a raw payload, NOT a { ok, data } wrapper. Adapter
    // must pass envelope.data through verbatim.
    const { adapter, ws } = setupConnected();
    ws.clearSent();

    const cb = vi.fn();
    adapter.emit('projects:list', {}, cb);

    const sent = ws.lastSentEnvelope() as { kind: string; id: string };
    expect(sent.kind).toBe('request');
    ws.deliverEnvelope({
      kind: 'response',
      id: sent.id,
      ok: true,
      data: { projects: [{ id: 'p-1' }] },
    });
    await Promise.resolve();
    await Promise.resolve();

    expect(cb).toHaveBeenCalledWith({ projects: [{ id: 'p-1' }] });
  });

  it('callback is not invoked on transport-level rejection (matches socket.io no-timeout ack)', async () => {
    const { adapter, ws } = setupConnected();
    ws.clearSent();

    const cb = vi.fn();
    adapter.emit('boom', {}, cb);
    const sent = ws.lastSentEnvelope() as { id: string };
    ws.deliverEnvelope({ kind: 'response', id: sent.id, ok: false, error: 'transport-failed' });
    await Promise.resolve();
    await Promise.resolve();

    expect(cb).not.toHaveBeenCalled();
  });

  it('on(event) fires for incoming event envelopes; off detaches', () => {
    const { adapter, ws } = setupConnected();
    const fn = vi.fn();
    adapter.on('hello', fn);

    ws.deliverEnvelope({ kind: 'event', seq: 1, event: 'hello', data: { x: 1 } });
    expect(fn).toHaveBeenCalledWith({ x: 1 });

    adapter.off('hello', fn);
    ws.deliverEnvelope({ kind: 'event', seq: 2, event: 'hello', data: { x: 2 } });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('id is a non-empty string after open', () => {
    const { adapter } = setupConnected();
    expect(typeof adapter.id).toBe('string');
    expect(adapter.id.length).toBeGreaterThan(0);
  });

  it('"connect_error" listener fires when underlying socket errors during open', () => {
    const client = new WsClient('ws://x/ws');
    const adapter = new WsSocketAdapter(client);
    const onError = vi.fn();
    adapter.on('connect_error', onError);

    adapter.connect();
    const ws = MockWebSocket.last()!;
    ws.acceptClose(1006);

    expect(onError).toHaveBeenCalled();
  });
});
