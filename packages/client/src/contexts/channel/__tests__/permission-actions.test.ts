import type { PendingControl } from '@code-quest/shared';
import type { RefObject } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createControlActions } from '../handlers/permission';

function makeRef<T>(value: T): RefObject<T> {
  return { current: value };
}

function makeSocket() {
  return { emit: vi.fn() } as unknown as Parameters<typeof createControlActions>[0]['socket'];
}

function makeActions(controls: PendingControl[]) {
  const socket = makeSocket();
  const setControls = vi.fn();
  const setChannelState = vi.fn();
  const actions = createControlActions({
    socket,
    channelId: 'ch-1',
    controlsRef: makeRef(controls),
    setControls,
    setElicitation: vi.fn(),
    setDiffReview: vi.fn(),
    setChannelState,
  });
  return { socket, setControls, setChannelState, actions };
}

const ctrl1: PendingControl = { requestId: 'req-1', subtype: 'can_use_tool', toolName: 'Bash' };
const ctrl2: PendingControl = { requestId: 'req-2', subtype: 'can_use_tool', toolName: 'Read' };

describe('respondToControl', () => {
  it('responds to correct control when requestId matches', () => {
    const { socket, actions } = makeActions([ctrl1, ctrl2]);
    actions.respondToControl({ behavior: 'allow', updatedInput: {} }, 'req-2');
    expect(socket.emit).toHaveBeenCalledWith(
      'chat:respond',
      expect.objectContaining({ requestId: 'req-2' }),
    );
  });

  it('responds to first control when no requestId given', () => {
    const { socket, actions } = makeActions([ctrl1, ctrl2]);
    actions.respondToControl({ behavior: 'allow', updatedInput: {} });
    expect(socket.emit).toHaveBeenCalledWith(
      'chat:respond',
      expect.objectContaining({ requestId: 'req-1' }),
    );
  });

  it('does NOT fall back to ctrls[0] when requestId not found (silent wrong-control bug)', () => {
    const { socket, actions } = makeActions([ctrl1]);
    actions.respondToControl({ behavior: 'allow', updatedInput: {} }, 'req-unknown');
    expect(socket.emit).not.toHaveBeenCalled();
  });

  it('does nothing when controls list is empty', () => {
    const { socket, actions } = makeActions([]);
    actions.respondToControl({ behavior: 'allow', updatedInput: {} });
    expect(socket.emit).not.toHaveBeenCalled();
  });

  it('removes the responded control from state', () => {
    const { setControls, actions } = makeActions([ctrl1, ctrl2]);
    actions.respondToControl({ behavior: 'allow', updatedInput: {} }, 'req-1');
    expect(setControls).toHaveBeenCalledOnce();
    const updater = setControls.mock.calls[0][0] as (prev: PendingControl[]) => PendingControl[];
    const result = updater([ctrl1, ctrl2]);
    expect(result).toEqual([ctrl2]);
  });
});
