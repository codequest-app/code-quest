#!/usr/bin/env node
/**
 * Quick integration test: AskUserQuestion flow
 * Run: node e2e/test-ask-question.mjs
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fakeScript = path.resolve(__dirname, 'fixtures/fake-claude.sh');
const fixture = path.resolve(__dirname, 'fixtures/fixtures/claude-ask-question.jsonl');

console.log('=== Testing AskUserQuestion parser flow ===\n');

// Simulate what session.ts does: spawn the fake script with fixture and parse output
const proc = spawn('bash', [fakeScript, 'help me choose'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, FIXTURE: fixture },
});

proc.stdin.end();

let buffer = '';
const events = [];

proc.stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() ?? '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const json = JSON.parse(trimmed);
      const parsed = parseJson(json);
      events.push(...parsed);
      for (const e of parsed) {
        console.log(`Event: ${e.type}`, JSON.stringify(e.data).slice(0, 120));
      }
    } catch (err) {
      console.error('Parse error:', err.message);
    }
  }
});

proc.on('close', () => {
  console.log('\n=== All events received ===');
  console.log(`Total events: ${events.length}`);

  // Simulate chatStore logic
  const unresolvedToolUses = [];
  let capturedAskQuestion = null;

  for (const event of events) {
    if (event.type === 'tool_use') {
      unresolvedToolUses.push(event.data.name);
      if (event.data.name === 'AskUserQuestion') {
        capturedAskQuestion = event.data.input?.questions;
      }
    }
    if (event.type === 'tool_result') {
      const idx = unresolvedToolUses.indexOf(event.data.name);
      if (idx !== -1) unresolvedToolUses.splice(idx, 1);
    }
  }

  console.log('\n=== chatStore simulation ===');
  console.log('unresolvedToolUses at result time:', unresolvedToolUses);
  console.log('capturedAskQuestion:', capturedAskQuestion ? 'YES' : 'NO');

  if (capturedAskQuestion) {
    console.log('\n✅ SUCCESS: AskUserQuestion detected!');
    console.log('Questions:', JSON.stringify(capturedAskQuestion, null, 2));
  } else {
    console.log('\n❌ FAIL: AskUserQuestion NOT detected');
  }
});

function parseJson(json) {
  const events = [];
  if (json.type === 'system' && json.subtype === 'init') {
    events.push({ type: 'init', data: { sessionId: json.session_id } });
  } else if (json.type === 'assistant') {
    const content = json.message?.content;
    if (Array.isArray(content)) {
      for (const block of content) {
        if (block.type === 'text') events.push({ type: 'text', data: { content: block.text } });
        if (block.type === 'thinking')
          events.push({ type: 'thinking', data: { content: block.thinking } });
        if (block.type === 'tool_use')
          events.push({
            type: 'tool_use',
            data: { id: block.id, name: block.name, input: block.input },
          });
        if (block.type === 'tool_result')
          events.push({
            type: 'tool_result',
            data: { name: block.tool_use_id ?? block.name, output: block.content ?? block.output },
          });
      }
    }
  } else if (json.type === 'result') {
    events.push({
      type: 'result',
      data: { stats: { costUsd: json.total_cost_usd, durationMs: json.duration_ms } },
    });
  }
  return events;
}
