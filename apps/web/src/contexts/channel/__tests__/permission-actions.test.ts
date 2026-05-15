import type { PendingControl } from '@code-quest/schemas';
import { segments as s } from '@code-quest/summoner/test';
import type { RefObject } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createFakeSummoner } from '@/test/fake-summoner';
import { createControlActions } from '../handlers/permission.ts';

function makeRef<T>(value: T): RefObject<T> {
  return { current: value };
}

async function setup(controls: PendingControl[]) {
  const summoner = createFakeSummoner();
  const claude = summoner.claude();
  const channelId = await claude.initialize();

  // Prime the server with pending controls so chat:respond is routed to CLI.
  await claude.send('chat:send', { channelId, message: 'go' });
  for (const c of controls) {
    await claude.emitSegment(
      s.assistant({
        toolUse: { id: c.toolUseId ?? c.requestId, name: c.toolName ?? 'Bash', input: {} },
      }),
    );
    await claude.emitSegment(s.controlRequest(c.requestId, c.subtype, c.toolName ?? 'Bash', {}));
  }

  const setControls = vi.fn();
  const setChannelState = vi.fn();
  const actions = createControlActions({
    socket: summoner.socket,
    channelId,
    controlsRef: makeRef(controls),
    setControls,
    setElicitation: vi.fn(),
    setChannelState,
  });

  return { claude, actions, setControls, setChannelState };
}

async function flush() {
  await new Promise<void>((r) => setImmediate(r));
}

const ctrl1: PendingControl = { requestId: 'req-1', subtype: 'can_use_tool', toolName: 'Bash' };
const ctrl2: PendingControl = { requestId: 'req-2', subtype: 'can_use_tool', toolName: 'Read' };

describe('respondToControl', () => {
  it('responds to correct control when requestId matches', async () => {
    const { claude, actions } = await setup([ctrl1, ctrl2]);
    actions.respondToControl({ behavior: 'allow', updatedInput: {} }, 'req-2');
    await flush();
    const responses = claude.received('control_response');
    expect(responses.map((r) => r.response.request_id)).toContain('req-2');
  });

  it('responds to first control when no requestId given', async () => {
    const { claude, actions } = await setup([ctrl1, ctrl2]);
    actions.respondToControl({ behavior: 'allow', updatedInput: {} });
    await flush();
    const responses = claude.received('control_response');
    expect(responses.map((r) => r.response.request_id)).toContain('req-1');
  });

  it('does NOT fall back to ctrls[0] when requestId not found (silent wrong-control bug)', async () => {
    const { claude, actions } = await setup([ctrl1]);
    const before = claude.received('control_response').length;
    actions.respondToControl({ behavior: 'allow', updatedInput: {} }, 'req-unknown');
    await flush();
    expect(claude.received('control_response').length).toBe(before);
  });

  it('does nothing when controls list is empty', async () => {
    const { claude, actions } = await setup([]);
    const before = claude.received('control_response').length;
    actions.respondToControl({ behavior: 'allow', updatedInput: {} });
    await flush();
    expect(claude.received('control_response').length).toBe(before);
  });

  it('removes the responded control from state', async () => {
    const { setControls, actions } = await setup([ctrl1, ctrl2]);
    actions.respondToControl({ behavior: 'allow', updatedInput: {} }, 'req-1');
    expect(setControls).toHaveBeenCalledOnce();
    const updater = setControls.mock.calls[0]![0] as (prev: PendingControl[]) => PendingControl[];
    const result = updater([ctrl1, ctrl2]);
    expect(result).toEqual([ctrl2]);
  });
});
