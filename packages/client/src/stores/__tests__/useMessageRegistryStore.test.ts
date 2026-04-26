import { beforeEach, describe, expect, it } from 'vitest';
import type { Message } from '../../types/ui';
import { useMessageRegistryStore } from '../useMessageRegistryStore';

beforeEach(() => {
  useMessageRegistryStore.setState({ channels: new Map() });
});

const fakeMessage = (id: string, content: string): Message =>
  ({ id, role: 'assistant', type: 'text', content, timestamp: Date.now() }) as Message;

describe('useMessageRegistryStore', () => {
  it('starts empty', () => {
    const { channels } = useMessageRegistryStore.getState();
    expect(channels).toEqual(new Map());
  });

  it('register adds a channel entry', () => {
    const messages = [fakeMessage('m1', 'hello')];
    useMessageRegistryStore.getState().register('ch-1', { projectCwd: '/proj', messages });

    const entry = useMessageRegistryStore.getState().channels.get('ch-1');
    expect(entry).toEqual({ projectCwd: '/proj', messages });
  });

  it('update replaces messages for an existing channel', () => {
    const msgs1 = [fakeMessage('m1', 'first')];
    const msgs2 = [fakeMessage('m1', 'first'), fakeMessage('m2', 'second')];

    useMessageRegistryStore.getState().register('ch-2', { projectCwd: '/proj', messages: msgs1 });
    useMessageRegistryStore.getState().update('ch-2', msgs2);

    const entry = useMessageRegistryStore.getState().channels.get('ch-2');
    expect(entry?.messages).toBe(msgs2);
    expect(entry?.messages).toHaveLength(2);
  });

  it('update is a no-op for unregistered channel', () => {
    const before = useMessageRegistryStore.getState().channels.size;
    useMessageRegistryStore.getState().update('unknown', []);
    expect(useMessageRegistryStore.getState().channels.size).toBe(before);
  });

  it('unregister removes a channel entry', () => {
    const messages = [fakeMessage('m1', 'hello')];
    useMessageRegistryStore.getState().register('ch-3', { projectCwd: '/proj', messages });
    useMessageRegistryStore.getState().unregister('ch-3');

    expect(useMessageRegistryStore.getState().channels.has('ch-3')).toBe(false);
  });

  it('getAllMessages aggregates messages from all channels', () => {
    const store = useMessageRegistryStore.getState();
    store.register('ch-a', { projectCwd: '/a', messages: [fakeMessage('m1', 'from a')] });
    store.register('ch-b', { projectCwd: '/b', messages: [fakeMessage('m2', 'from b')] });

    const all = useMessageRegistryStore.getState().getAllMessages();
    expect(all).toHaveLength(2);
    expect(all.map((e) => e.channelId)).toEqual(expect.arrayContaining(['ch-a', 'ch-b']));
    expect(all.find((e) => e.channelId === 'ch-a')?.message.content).toBe('from a');
  });
});
