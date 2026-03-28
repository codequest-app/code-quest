import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { createFakeClaude } from '../../test/fake-claude';
import { SocketProvider, useSocket } from '../SocketContext';

function wrapper(socket = createFakeClaude().socket) {
  return ({ children }: { children: ReactNode }) => (
    <SocketProvider socket={socket}>{children}</SocketProvider>
  );
}

describe('SocketContext', () => {
  it('provides socket via useSocket', () => {
    const { socket } = createFakeClaude();
    const { result } = renderHook(() => useSocket(), { wrapper: wrapper(socket) });
    expect(result.current.socket).toBe(socket);
  });

  it('throws when useSocket is called outside provider', () => {
    expect(() => {
      renderHook(() => useSocket());
    }).toThrow('useSocket must be used within a SocketProvider');
  });
});
