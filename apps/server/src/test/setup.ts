import 'reflect-metadata';
import { createFakeSocket } from '@code-quest/test-kit';

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => createFakeSocket()),
}));
