import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TypedSocket } from '@/socket/client';
import { SocketProvider } from '../../SocketContext';
import { SessionIdProvider, useSessionId } from '../SessionIdContext';

type Listener = (...args: unknown[]) => void;

function createMockSocket(): {
  socket: TypedSocket;
  fire: (event: string, payload: unknown) => void;
  listenerCount: (event: string) => number;
} {
  const listeners = new Map<string, Set<Listener>>();
  const socket = {
    on(event: string, fn: Listener) {
      let set = listeners.get(event);
      if (!set) {
        set = new Set();
        listeners.set(event, set);
      }
      set.add(fn);
    },
    off(event: string, fn: Listener) {
      listeners.get(event)?.delete(fn);
    },
    emit() {
      // no-op — tests don't verify outbound emits
    },
  } as unknown as TypedSocket;
  return {
    socket,
    fire(event, payload) {
      for (const fn of listeners.get(event) ?? []) fn(payload);
    },
    listenerCount(event) {
      return listeners.get(event)?.size ?? 0;
    },
  };
}

function Display() {
  const sessionId = useSessionId();
  return <span data-testid="session-id">{sessionId === null ? 'null' : sessionId}</span>;
}

function renderWithSocket(channelId: string, mockSocket: TypedSocket) {
  return render(
    <SocketProvider socket={mockSocket}>
      <SessionIdProvider channelId={channelId}>
        <Display />
      </SessionIdProvider>
    </SocketProvider>,
  );
}

describe('SessionIdContext', () => {
  it('useSessionId() returns null before any session:init arrives', () => {
    const { socket } = createMockSocket();
    renderWithSocket('ch-1', socket);
    expect(screen.getByTestId('session-id')).toHaveTextContent('null');
  });

  it('useSessionId() returns the sessionId after session:init for the same channelId', () => {
    const { socket, fire } = createMockSocket();
    renderWithSocket('ch-1', socket);

    act(() => {
      fire('session:init', { channelId: 'ch-1', sessionId: 'sess-abc', config: {} });
    });

    expect(screen.getByTestId('session-id')).toHaveTextContent('sess-abc');
  });

  it('ignores session:init for a different channelId', () => {
    const { socket, fire } = createMockSocket();
    renderWithSocket('ch-1', socket);

    act(() => {
      fire('session:init', { channelId: 'ch-2', sessionId: 'sess-xyz', config: {} });
    });

    expect(screen.getByTestId('session-id')).toHaveTextContent('null');
  });

  it('overwrites with the latest sessionId on subsequent session:init', () => {
    const { socket, fire } = createMockSocket();
    renderWithSocket('ch-1', socket);

    act(() => {
      fire('session:init', { channelId: 'ch-1', sessionId: 'sess-abc', config: {} });
    });
    expect(screen.getByTestId('session-id')).toHaveTextContent('sess-abc');

    act(() => {
      fire('session:init', { channelId: 'ch-1', sessionId: 'sess-def', config: {} });
    });
    expect(screen.getByTestId('session-id')).toHaveTextContent('sess-def');
  });

  it('removes the session:init listener when the provider unmounts', () => {
    const { socket, listenerCount } = createMockSocket();
    const { unmount } = renderWithSocket('ch-1', socket);

    expect(listenerCount('session:init')).toBe(1);
    unmount();
    expect(listenerCount('session:init')).toBe(0);
  });
});
