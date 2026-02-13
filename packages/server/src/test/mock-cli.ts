#!/usr/bin/env node
/**
 * TypeScript Mock CLI for testing.
 * Replaces shell-based mocks with a persistent, interactive Node.js process.
 *
 * Behavior controlled by MOCK_SCENARIO env var (default: 'echo').
 * Reads lines from stdin and writes JSON events to stdout.
 */
import { createInterface } from 'node:readline';

const scenario = process.env.MOCK_SCENARIO || 'echo';
const sessionId = `mock-session-${Date.now()}`;
let turnCount = 0;

function write(obj: unknown): void {
  process.stdout.write(`${JSON.stringify(obj)}\n`);
}

function emitInit(): void {
  write({ type: 'system', subtype: 'init', session_id: sessionId });
}

function emitText(content: string): void {
  write({
    type: 'assistant',
    message: { content: [{ type: 'text', text: content }] },
  });
}

function emitResult(): void {
  write({
    type: 'result',
    total_cost_usd: 0.001,
    duration_ms: 100,
    input_tokens: 10,
    output_tokens: 5,
  });
}

function emitPermission(toolName: string, description: string): void {
  write({
    type: 'permission',
    tool_name: toolName,
    description,
  });
}

const scenarios: Record<string, (msg: string) => void> = {
  echo: (msg) => {
    emitText(`Echo: ${msg}`);
    emitResult();
  },

  stream: (msg) => {
    const words = msg.split(' ');
    for (const word of words) {
      emitText(`${word} `);
    }
    emitResult();
  },

  permission: (msg) => {
    emitText('I need to read a file.');
    emitPermission('Read', `Reading file: ${msg}`);
    // After permission, wait for next stdin line (the response)
    // The response handler below will continue
  },

  error: (_msg) => {
    write({ type: 'error', data: { message: 'Mock error occurred' } });
    emitResult();
  },

  'multi-turn': (msg) => {
    turnCount++;
    emitText(`Turn ${turnCount}: ${msg}`);
    emitResult();
  },
};

let waitingForPermissionResponse = false;

// Emit init on startup
emitInit();

const rl = createInterface({ input: process.stdin });

rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  if (waitingForPermissionResponse) {
    waitingForPermissionResponse = false;
    emitText(`Permission response: ${trimmed}`);
    emitResult();
    return;
  }

  const handler = scenarios[scenario];
  if (handler) {
    handler(trimmed);
    if (scenario === 'permission') {
      waitingForPermissionResponse = true;
    }
  } else {
    scenarios.echo(trimmed);
  }
});

rl.on('close', () => {
  process.exit(0);
});
