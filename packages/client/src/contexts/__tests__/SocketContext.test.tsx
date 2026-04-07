import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { createFakeSummoner } from '../../test/fake-summoner';
import { SocketProvider, useSocket } from '../SocketContext';

function wrapper(socket = createFakeSummoner().socket) {
  return ({ children }: { children: ReactNode }) => (
    <SocketProvider socket={socket}>{children}</SocketProvider>
  );
}

describe('SocketContext', () => {
  it('provides socket via useSocket', () => {
    const summoner = createFakeSummoner();
    const { result } = renderHook(() => useSocket(), { wrapper: wrapper(summoner.socket) });
    expect(result.current.socket).toBe(summoner.socket);
  });

  it('throws when useSocket is called outside provider', () => {
    expect(() => {
      renderHook(() => useSocket());
    }).toThrow('useSocket must be used within a SocketProvider');
  });
});
