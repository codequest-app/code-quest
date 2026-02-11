import { test, expect } from '@playwright/test';
import { io, type Socket } from 'socket.io-client';
import path from 'path';

/**
 * E2E Test: Claude CLI integration via mock script
 *
 * Validates the server PTY → Socket.io data flow by spawning a mock script
 * that emits stream-json lines, and verifying the output arrives correctly.
 */

const SERVER_URL = 'http://localhost:3000';
const MOCK_SCRIPT = path.resolve(__dirname, 'fixtures/mock-claude.sh');

function connectSocket(): Socket {
  return io(SERVER_URL, {
    transports: ['websocket'],
    forceNew: true,
  });
}

test.describe('Claude CLI integration (mock)', () => {
  let socket: Socket;

  test.beforeEach(async () => {
    socket = connectSocket();
    await new Promise<void>((resolve, reject) => {
      socket.on('connect', resolve);
      socket.on('connect_error', reject);
    });
  });

  test.afterEach(async () => {
    socket.disconnect();
  });

  test('should receive stream-json output from mock claude script', async () => {
    const output: string[] = [];
    let sessionId: string | null = null;

    const exitPromise = new Promise<number>((resolve) => {
      socket.on('terminal:exit', (sid: string, exitCode: number) => {
        if (sid === sessionId) {
          resolve(exitCode);
        }
      });
    });

    socket.on('terminal:data', (sid: string, data: string) => {
      if (sid === sessionId) {
        output.push(data);
      }
    });

    // Create terminal with bash running the mock script
    const createdPromise = new Promise<string>((resolve) => {
      socket.on('terminal:created', (sid: string) => {
        resolve(sid);
      });
    });

    socket.emit('terminal:create', {
      shell: 'bash',
      args: [MOCK_SCRIPT],
    });

    sessionId = await createdPromise;
    expect(sessionId).toBeTruthy();

    // Wait for the script to finish
    const exitCode = await exitPromise;
    expect(exitCode).toBe(0);

    // Combine all output chunks
    const fullOutput = output.join('');

    // Verify stream-json lines are present
    expect(fullOutput).toContain('"type":"system"');
    expect(fullOutput).toContain('"type":"assistant"');
    expect(fullOutput).toContain('"type":"result"');
    expect(fullOutput).toContain('"session_id":"mock-123"');
    expect(fullOutput).toContain('"total_cost_usd"');
  });

  test('should emit terminal:exit when mock script completes', async () => {
    const createdPromise = new Promise<string>((resolve) => {
      socket.on('terminal:created', (sid: string) => {
        resolve(sid);
      });
    });

    socket.emit('terminal:create', {
      shell: 'bash',
      args: [MOCK_SCRIPT],
    });

    const sessionId = await createdPromise;

    const exitCode = await new Promise<number>((resolve) => {
      socket.on('terminal:exit', (sid: string, code: number) => {
        if (sid === sessionId) {
          resolve(code);
        }
      });
    });

    expect(exitCode).toBe(0);
  });
});
