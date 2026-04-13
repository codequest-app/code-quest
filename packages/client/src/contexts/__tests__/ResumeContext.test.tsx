import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { TypedSocket } from '../../socket/client';
import { ResumeProvider, useResume } from '../ResumeContext';
import { SocketProvider } from '../SocketContext';

function makeStubSocket(ackResponder: (payload: unknown) => unknown) {
  const emit = vi.fn((_event: string, _payload: unknown, cb?: (raw: unknown) => void) => {
    cb?.(ackResponder(_payload));
  });
  return { emit } as unknown as TypedSocket & { emit: ReturnType<typeof vi.fn> };
}

function wrap(socket: TypedSocket) {
  return ({ children }: { children: ReactNode }) => (
    <SocketProvider socket={socket}>
      <ResumeProvider>{children}</ResumeProvider>
    </SocketProvider>
  );
}

describe('ResumeContext', () => {
  it('emits session:resume and resolves with channelId on success', async () => {
    const socket = makeStubSocket(() => ({ channelId: 'ch-1' }));
    const { result } = renderHook(() => useResume(), { wrapper: wrap(socket) });

    const out = await result.current.resume('sid-X');

    expect(out).toEqual({ channelId: 'ch-1' });
    expect((socket as unknown as { emit: ReturnType<typeof vi.fn> }).emit).toHaveBeenCalledWith(
      'session:resume',
      { sessionId: 'sid-X' },
      expect.any(Function),
    );
  });

  it('rejects with the server error message when ack returns { error }', async () => {
    const socket = makeStubSocket(() => ({ error: 'boom' }));
    const { result } = renderHook(() => useResume(), { wrapper: wrap(socket) });

    await expect(result.current.resume('sid-X')).rejects.toThrow('boom');
  });

  it('rejects with "Invalid response" when ack fails sessionResumeResponseSchema', async () => {
    const socket = makeStubSocket(() => 'not-an-object');
    const { result } = renderHook(() => useResume(), { wrapper: wrap(socket) });

    await expect(result.current.resume('sid-X')).rejects.toThrow('Invalid response');
  });

  it('throws when useResume is called outside ResumeProvider', () => {
    expect(() => {
      renderHook(() => useResume());
    }).toThrow('useResume must be used within a ResumeProvider');
  });
});
