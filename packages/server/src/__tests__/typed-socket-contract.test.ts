import type { TypedSocket } from '@code-quest/shared';
import { ClaudeAdapter, ProcessRunner } from '@code-quest/summoner';
import { createFakeSocket, FakeProcessProvider } from '@code-quest/summoner/test';
import { describe, expect, it, vi } from 'vitest';
import { Channel } from '../socket/channel.ts';
import { ChannelEmitter } from '../socket/channel-emitter.ts';

/**
 * Contract tests proving that ChannelEmitter operates against the local
 * TypedSocket interface only — independent of socket.io. The fake socket
 * (createFakeSocket from @code-quest/summoner/test) MUST satisfy TypedSocket
 * structurally; if this fails to compile, the abstraction has leaked.
 *
 * These tests are the pre-condition for swapping in WsSocketAdapter:
 * any object that implements TypedSocket MUST drive ChannelEmitter the same way.
 */
describe('TypedSocket contract', () => {
  function makeChannel(channelId = 'ch-test'): Channel {
    const runner = new ProcessRunner({
      adapter: new ClaudeAdapter(),
      processProvider: new FakeProcessProvider(),
    });
    return new Channel(runner, channelId, 'claude', '/test/cwd');
  }

  it('FakeSocket.serverSocket satisfies TypedSocket structurally', () => {
    const fake = createFakeSocket();
    const { serverSocket } = fake;
    const asTyped: TypedSocket = serverSocket;

    expect(typeof asTyped.id).toBe('string');
    expect(typeof asTyped.emit).toBe('function');
    expect(typeof asTyped.on).toBe('function');
  });

  it('handleConnection wires emitter handlers using only TypedSocket surface', () => {
    const emitter = new ChannelEmitter();
    const handler = vi.fn();
    emitter.on('chat:send', handler);

    const ch = makeChannel('ch-1');
    const fake = createFakeSocket();
    const { serverSocket } = fake;
    const socket: TypedSocket = serverSocket;

    emitter.handleConnection(socket, (id) => (id === 'ch-1' ? ch : undefined));

    fake.emit('chat:send', { channelId: 'ch-1', text: 'hello' });

    expect(handler).toHaveBeenCalledWith(
      ch,
      { channelId: 'ch-1', text: 'hello' },
      socket,
      undefined,
    );
  });

  it('disconnect listener cleans up channel/socket maps', () => {
    const emitter = new ChannelEmitter();
    emitter.on('chat:send', vi.fn());

    const fake = createFakeSocket();
    const { serverSocket } = fake;
    const socket: TypedSocket = serverSocket;

    emitter.handleConnection(socket, () => undefined);
    emitter.addSocketToChannel('ch-1', socket);

    expect(emitter.getSocketCount('ch-1')).toBe(1);

    fake.emit('disconnect');

    expect(emitter.getSocketCount('ch-1')).toBe(0);
  });

  it('dispatch invokes handler with same socket reference passed to handleConnection', () => {
    const emitter = new ChannelEmitter();
    const seen: TypedSocket[] = [];
    emitter.on('chat:send', (_ch, _payload, sock) => {
      if (sock) seen.push(sock);
    });

    const ch = makeChannel('ch-1');
    const fake = createFakeSocket();
    const { serverSocket } = fake;
    const socket: TypedSocket = serverSocket;

    emitter.handleConnection(socket, (id) => (id === 'ch-1' ? ch : undefined));
    fake.emit('chat:send', { channelId: 'ch-1' });

    expect(seen).toHaveLength(1);
    expect(seen[0]).toBe(socket);
  });
});
