#!/usr/bin/env node
/**
 * TypeScript Mock CLI for testing.
 * Replaces shell-based mocks with a persistent, interactive Node.js process.
 *
 * Behavior controlled by MOCK_SCENARIO env var (default: 'echo').
 * Provider format controlled by --provider arg (default: 'claude').
 * Reads lines from stdin and writes JSON events to stdout.
 *
 * Scenarios:
 *   echo        — echo back stdin lines (default)
 *   stream      — word-by-word streaming
 *   permission  — emit permission request
 *   error       — emit error event
 *   multi-turn  — numbered turns
 *   fixture     — replay a JSONL fixture file (set MOCK_FIXTURE=path/to/file.jsonl)
 *                 First line (init) emits immediately; remaining lines replay on first stdin message.
 */
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

const scenario = process.env.MOCK_SCENARIO || 'echo';
const sessionId = `mock-session-${Date.now()}`;
let turnCount = 0;

// Parse --provider flag from argv
const providerIndex = process.argv.indexOf('--provider');
const provider = providerIndex !== -1 ? process.argv[providerIndex + 1] : 'claude';
const isGemini = provider === 'gemini';

function write(obj: unknown): void {
  process.stdout.write(`${JSON.stringify(obj)}\n`);
}

function emitInit(): void {
  if (isGemini) {
    write({ type: 'init', session_id: sessionId, model: 'mock-gemini' });
  } else {
    write({ type: 'system', subtype: 'init', session_id: sessionId });
  }
}

function emitText(content: string): void {
  if (isGemini) {
    write({ type: 'message', role: 'assistant', content });
  } else {
    write({
      type: 'assistant',
      message: { content: [{ type: 'text', text: content }] },
    });
  }
}

function emitResult(): void {
  if (isGemini) {
    write({
      type: 'result',
      stats: { duration_ms: 100, input_tokens: 10, output_tokens: 5 },
    });
  } else {
    write({
      type: 'result',
      total_cost_usd: 0.001,
      duration_ms: 100,
      input_tokens: 10,
      output_tokens: 5,
    });
  }
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

// ── Fixture replay mode ──
if (scenario === 'fixture') {
  const fixturePath = process.env.MOCK_FIXTURE;
  if (!fixturePath) {
    process.stderr.write('MOCK_FIXTURE env var is required for fixture scenario\n');
    process.exit(1);
  }

  const lines = readFileSync(fixturePath, 'utf-8')
    .split('\n')
    .filter((l) => l.trim());

  if (lines.length === 0) {
    process.stderr.write(`Empty fixture: ${fixturePath}\n`);
    process.exit(1);
  }

  // Emit first line (init) immediately
  process.stdout.write(`${lines[0]}\n`);

  let replayed = false;
  const rl = createInterface({ input: process.stdin });

  rl.on('line', (line) => {
    if (!line.trim()) return;

    if (!replayed) {
      replayed = true;
      // Replay remaining fixture lines
      for (let i = 1; i < lines.length; i++) {
        process.stdout.write(`${lines[i]}\n`);
      }
    } else {
      // Multi-turn fallback: echo
      emitText(`Echo: ${line.trim()}`);
      emitResult();
    }
  });

  rl.on('close', () => process.exit(0));
} else {
  // ── Standard scenario mode ──
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
}
