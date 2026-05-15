import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createSegments, type SegmentBuilders } from './segment-builders.ts';

// ── CLI fixture templates ──
// Each template is loaded from __fixtures__/claude/{real,synthetic}/*.jsonl.
// real/      = verbatim DB exports (code_quest.raw_entries) or real CLI recordings
// synthetic/ = hand-crafted for event types not yet captured in real sessions

const FIXTURE_DIR = join(import.meta.dirname, './__fixtures__/claude');
const REAL = join(FIXTURE_DIR, 'real');
const SYNTHETIC = join(FIXTURE_DIR, 'synthetic');
const load = (dir: string, name: string) => readFileSync(join(dir, name), 'utf-8');

const TEMPLATES = {
  INIT: load(REAL, 'init.jsonl'),
  ASSISTANT_TEXT: load(REAL, 'assistant-text.jsonl'),
  ASSISTANT_TOOL: load(REAL, 'assistant-tool.jsonl'),
  THINKING: load(REAL, 'thinking.jsonl'),
  CONTROL_REQUEST: load(REAL, 'control-request.jsonl'),
  CONTROL_REQUEST_BASH: load(REAL, 'control-request-bash.jsonl'),
  CONTROL_REQUEST_ASK_USER_QUESTION: load(REAL, 'control-request-ask-user-question.jsonl'),
  CONTROL_REQUEST_EXIT_PLAN_MODE: load(REAL, 'control-request-exit-plan-mode.jsonl'),
  CONTROL_RESPONSE: load(REAL, 'control-response.jsonl'),
  CONTROL_RESPONSE_ERROR: load(REAL, 'control-response-error.jsonl'),
  CONTROL_CANCEL_REQUEST: load(REAL, 'control-cancel-request.jsonl'),
  TOOL_RESULT: load(REAL, 'tool-result.jsonl'),
  USER_TEXT: load(REAL, 'user-text.jsonl'),
  USER_SKILL_BODY: load(REAL, 'user-skill-body.jsonl'),
  RESULT_SUCCESS: load(REAL, 'result-success.jsonl'),
  RESULT_ERROR: load(REAL, 'result-error.jsonl'),
  RESULT_IS_ERROR_NO_ERRORS: load(REAL, 'result-is-error-no-errors.jsonl'),
  RESULT_RESUME_NOT_FOUND: load(SYNTHETIC, 'result-resume-not-found.jsonl'),
  STATUS: load(REAL, 'status.jsonl'),
  TASK_STARTED: load(REAL, 'task-started.jsonl'),
  STREAM_TEXT_DELTA: load(REAL, 'stream-text-delta.jsonl'),
  STREAM_INPUT_JSON_DELTA: load(REAL, 'stream-input-json-delta.jsonl'),
  STREAM_THINKING_DELTA: load(REAL, 'stream-thinking-delta.jsonl'),
  STREAM_SIGNATURE_DELTA: load(REAL, 'stream-signature-delta.jsonl'),
  STREAM_CONTENT_BLOCK_START: load(REAL, 'stream-content-block-start.jsonl'),
  STREAM_CONTENT_BLOCK_STOP: load(REAL, 'stream-content-block-stop.jsonl'),
  STREAM_MESSAGE_START: load(REAL, 'stream-message-start.jsonl'),
  STREAM_MESSAGE_DELTA: load(REAL, 'stream-message-delta.jsonl'),
  STREAM_MESSAGE_STOP: load(REAL, 'stream-message-stop.jsonl'),
  RATE_LIMIT_EVENT: load(REAL, 'rate-limit-event.jsonl'),
  HOOK_STARTED: load(REAL, 'hook-started.jsonl'),
  HOOK_RESPONSE: load(REAL, 'hook-response.jsonl'),
  TOOL_USE: load(REAL, 'tool-use.jsonl'),
  AGENT_TOOL: load(REAL, 'assistant-agent.jsonl'),
  CONTROL_REQUEST_OPEN_DIFF: load(SYNTHETIC, 'control-request-open-diff.jsonl'),
  CONTROL_REQUEST_OPEN_IN_EDITOR: load(SYNTHETIC, 'control-request-open-in-editor.jsonl'),
  SPEECH_TO_TEXT_MESSAGE: load(SYNTHETIC, 'speech-to-text-message.jsonl'),
  NOTIFICATION: load(SYNTHETIC, 'notification.jsonl'),
  NEW_SESSION_NOTIFICATION: load(SYNTHETIC, 'new-session-notification.jsonl'),
  CONTROL_REQUEST_ELICITATION: load(SYNTHETIC, 'control-request-elicitation.jsonl'),
  CONTROL_REQUEST_SHOW_NOTIFICATION: load(SYNTHETIC, 'control-request-show-notification.jsonl'),
  STREAMLINED_TEXT: load(SYNTHETIC, 'streamlined-text.jsonl'),
  STREAMLINED_TOOL_USE_SUMMARY: load(SYNTHETIC, 'streamlined-tool-use-summary.jsonl'),
  CITATIONS_DELTA: load(SYNTHETIC, 'citations-delta.jsonl'),
  THINKING_DELTA_LEGACY: load(SYNTHETIC, 'stream-thinking-delta-legacy.jsonl'),
  TASK_NOTIFICATION: load(REAL, 'task-notification.jsonl'),
  TASK_PROGRESS: load(REAL, 'task-progress.jsonl'),
  CLI_ERROR: load(REAL, 'cli-error.jsonl'),
  BRIDGE_STATE: load(SYNTHETIC, 'bridge-state.jsonl'),
  COMPACT_BOUNDARY: load(SYNTHETIC, 'compact-boundary.jsonl'),
  EXPERIMENT_GATES: load(SYNTHETIC, 'experiment-gates.jsonl'),
  AUTH_STATUS: load(REAL, 'auth-status.jsonl'),
  AUTH_URL: load(SYNTHETIC, 'auth-url.jsonl'),
  UNKNOWN_EVENT: load(SYNTHETIC, 'unknown-event.jsonl'),
  SYSTEM_MIRROR_ERROR: load(SYNTHETIC, 'system-mirror-error.jsonl'),
  CONTROL_SEED_READ_STATE: load(SYNTHETIC, 'control-seed-read-state.jsonl'),
  CONTROL_CHANNEL_ENABLE: load(SYNTHETIC, 'control-channel-enable.jsonl'),
} as const;

const _s = createSegments(TEMPLATES);
export const segments: SegmentBuilders = _s.segments;
export const resetSeq: () => void = _s.resetSeq;
