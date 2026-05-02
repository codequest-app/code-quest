import 'reflect-metadata';
import { createFakeSocket } from '@code-quest/summoner/test';
import failOnConsole from 'vitest-fail-on-console';

failOnConsole();

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => createFakeSocket()),
}));
