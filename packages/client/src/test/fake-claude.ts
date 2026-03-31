import { FakeClaude as ServerFakeClaude } from '@code-quest/server/test';
import { act } from '@testing-library/react';
import type { TypedSocket } from '../socket/client';

export class FakeClaude extends ServerFakeClaude {
  declare socket: TypedSocket;

  override async emit(segment: string): Promise<{ requestId: string | null }> {
    let result!: { requestId: string | null };
    await act(async () => {
      result = await super.emit(segment);
    });
    return result;
  }

  /** Simulate server pushing a socket event to client (e.g. settings:update, settings:usage) */
  async pushServerEvent(event: string, payload: Record<string, unknown>): Promise<void> {
    await act(async () => {
      (
        this.socket as unknown as {
          serverSocket: { emit: (e: string, ...args: unknown[]) => void };
        }
      ).serverSocket.emit(event, payload);
    });
  }
}

export function createFakeClaude(): FakeClaude {
  return new FakeClaude();
}
