import 'reflect-metadata';
import { createFakeSocket } from '@code-quest/summoner/test';

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => createFakeSocket()),
}));
