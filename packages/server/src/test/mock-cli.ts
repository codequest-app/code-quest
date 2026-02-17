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

function emitToolUse(id: string, name: string, input: unknown): void {
  if (isGemini) {
    write({ type: 'tool_use', tool_id: id, tool_name: name, parameters: input });
  } else {
    write({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', id, name, input }] },
    });
  }
}

function emitToolResult(id: string, name: string, output: string): void {
  if (isGemini) {
    write({ type: 'tool_result', tool_id: id, output });
  } else {
    // Use 'name' (not 'tool_use_id') so chatStore can match unresolvedToolUses by tool name
    write({
      type: 'assistant',
      message: { content: [{ type: 'tool_result', name, content: output }] },
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

/** Simulated tool sequence for battle progression */
const MOCK_TOOLS = [
  {
    name: 'Read',
    input: { file_path: 'src/auth/tokenValidator.ts' },
    output: 'export function validateToken(token: string) { ... }',
  },
  {
    name: 'Edit',
    input: { file_path: 'src/auth/tokenValidator.ts', old_string: '...', new_string: '...' },
    output: 'File edited successfully',
  },
  {
    name: 'Write',
    input: { file_path: 'src/auth/types.ts', content: '...' },
    output: 'File written successfully',
  },
  { name: 'Bash', input: { command: 'npm test' }, output: 'All tests passed' },
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function emitWithToolUse(text: string): Promise<void> {
  emitText(`Working on: ${text}`);
  for (let i = 0; i < MOCK_TOOLS.length; i++) {
    await sleep(300);
    const tool = MOCK_TOOLS[i];
    const toolId = `toolu_mock_${Date.now()}_${i}`;
    emitToolUse(toolId, tool.name, tool.input);
    await sleep(200);
    emitToolResult(toolId, tool.name, tool.output);
  }
  await sleep(200);
  emitText(`Completed: ${text}`);
  emitResult();
}

/** Extract user text from stdin JSON, or return raw string as-is */
function extractUserText(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    const content = parsed?.message?.content;
    if (Array.isArray(content)) {
      return content
        .filter((c: { type: string }) => c.type === 'text')
        .map((c: { text: string }) => c.text)
        .join('');
    }
  } catch {
    // Not JSON — return as-is
  }
  return raw;
}

/** Mock task plan response for orchestrator "Plan Tasks" flow */
const MOCK_TASK_PLAN = `Based on your requirements, here's the task breakdown:

\`\`\`json
{
  "tasks": [
    { "description": "Refactor authentication module: extract token validation into a shared utility at src/auth/tokenValidator.ts", "provider": "claude" },
    { "description": "Add unit tests for the new token validator with edge cases (expired, malformed, missing claims)", "provider": "claude", "dependsOn": [0] },
    { "description": "Update API documentation in docs/auth.md to reflect the new token validation flow", "provider": "gemini", "dependsOn": [0] }
  ]
}
\`\`\`

This splits the work into 3 focused tasks. Task 1 runs first, then tasks 2 and 3 run in parallel.`;

const scenarios: Record<string, (msg: string) => void | Promise<void>> = {
  echo: async (raw) => {
    const text = extractUserText(raw);
    // Detect orchestrator "Plan Tasks" prompt
    if (text.includes('break down the work into sub-tasks')) {
      emitText(MOCK_TASK_PLAN);
      emitResult();
      return;
    }
    await emitWithToolUse(text);
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
let pendingWork: Promise<void> = Promise.resolve();

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
      emitText(`Echo: ${extractUserText(line.trim())}`);
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
      const result = handler(trimmed);
      if (result instanceof Promise) {
        pendingWork = pendingWork.then(() => result);
      }
      if (scenario === 'permission') {
        waitingForPermissionResponse = true;
      }
    } else {
      const result = scenarios.echo(trimmed);
      if (result instanceof Promise) {
        pendingWork = pendingWork.then(() => result);
      }
    }
  });

  rl.on('close', () => {
    pendingWork.then(() => process.exit(0));
  });
}
