import { describe, expect, it } from 'vitest';
import { initialChannelState } from '@/types/chat';
import { notificationHandlerOn } from '../notification.ts';

const onRawEvent = notificationHandlerOn['raw:event'];

function basePayload(data: Record<string, unknown>) {
  return { channelId: 'ch', rawType: 'tool_use' as const, data };
}

describe('onRawEvent — tool_use', () => {
  it('uses tool name from data.name when present', () => {
    const state = initialChannelState('ch');
    const next = onRawEvent(state, basePayload({ name: 'Bash', id: 'tu-1', input: {} }));
    const msg = next.messages[next.messages.length - 1];
    expect(msg?.type).toBe('tool_use');
    expect(msg?.content).toBe('Bash');
  });

  it('falls back to "Unknown" when data.name is missing', () => {
    const state = initialChannelState('ch');
    const next = onRawEvent(state, basePayload({ id: 'tu-1', input: {} }));
    const msg = next.messages[next.messages.length - 1];
    expect(msg?.content).toBe('Unknown');
  });

  it('falls back to "Unknown" when data.name is empty string', () => {
    const state = initialChannelState('ch');
    const next = onRawEvent(state, basePayload({ name: '', id: 'tu-1', input: {} }));
    const msg = next.messages[next.messages.length - 1];
    expect(msg?.content).toBe('Unknown');
  });

  it('falls back to "Unknown" when data.name is not a string', () => {
    const state = initialChannelState('ch');
    const next = onRawEvent(state, basePayload({ name: 42, id: 'tu-1', input: {} }));
    const msg = next.messages[next.messages.length - 1];
    expect(msg?.content).toBe('Unknown');
  });
});
