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
}

export function createFakeClaude(): FakeClaude {
  return new FakeClaude();
}
