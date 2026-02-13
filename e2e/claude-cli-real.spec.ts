import { expect, test } from '@playwright/test';
import { io, type Socket } from 'socket.io-client';

/**
 * E2E Test: Real Claude CLI integration
 *
 * Skipped by default — enable manually to test against the real Claude CLI.
 * WARNING: This will call the Anthropic API and incur costs.
 */

const SERVER_URL = 'http://localhost:3000';

function connectSocket(): Socket {
  return io(SERVER_URL, {
    transports: ['websocket'],
    forceNew: true,
  });
}

test.describe('Claude CLI integration (real)', () => {
  test.skip(true, 'Requires real Claude CLI and incurs API costs');

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

  test('should receive stream-json output from real claude CLI', async () => {
    // Increase timeout for real API call
    test.setTimeout(60_000);

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

    const createdPromise = new Promise<string>((resolve) => {
      socket.on('terminal:created', (sid: string) => {
        resolve(sid);
      });
    });

    socket.emit('terminal:create', {
      shell: 'claude',
      args: [
        '--print',
        '--output-format',
        'stream-json',
        '--verbose',
        '-p',
        'Say hello in one sentence',
      ],
    });

    sessionId = await createdPromise;
    expect(sessionId).toBeTruthy();

    const exitCode = await exitPromise;
    expect(exitCode).toBe(0);

    const fullOutput = output.join('');

    // Verify stream-json output structure
    expect(fullOutput).toContain('"type":"result"');
    expect(fullOutput).toContain('total_cost_usd');
  });
});
