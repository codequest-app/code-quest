import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createSegments, type SegmentBuilders } from './segment-builders';

// ── CLI fixture templates ──
// Each template is loaded from __fixtures__/claude/{real,synthetic}/*.jsonl.
// real/      = verbatim DB exports (code_quest.raw_entries) or real CLI recordings
// synthetic/ = hand-crafted for event types not yet captured in real sessions

const FIXTURE_DIR = join(import.meta.dirname, '../__fixtures__/claude');
const REAL = join(FIXTURE_DIR, 'real');
const SYNTHETIC = join(FIXTURE_DIR, 'synthetic');
const load = (dir: string, name: string) => readFile(join(dir, name), 'utf-8');

const TEMPLATES = {
  INIT: await load(REAL, 'init.jsonl'),
  ASSISTANT_TEXT: await load(REAL, 'assistant-text.jsonl'),
  ASSISTANT_TOOL: await load(REAL, 'assistant-tool.jsonl'),
  THINKING: await load(REAL, 'thinking.jsonl'),
  CONTROL_REQUEST: await load(REAL, 'control-request.jsonl'),
  CONTROL_REQUEST_BASH: await load(REAL, 'control-request-bash.jsonl'),
  CONTROL_REQUEST_ASK_USER_QUESTION: await load(REAL, 'control-request-ask-user-question.jsonl'),
  CONTROL_REQUEST_EXIT_PLAN_MODE: await load(REAL, 'control-request-exit-plan-mode.jsonl'),
  CONTROL_RESPONSE: await load(REAL, 'control-response.jsonl'),
  CONTROL_RESPONSE_ERROR: await load(REAL, 'control-response-error.jsonl'),
  CONTROL_CANCEL_REQUEST: await load(REAL, 'control-cancel-request.jsonl'),
  TOOL_RESULT: await load(REAL, 'tool-result.jsonl'),
  USER_TEXT: await load(REAL, 'user-text.jsonl'),
  RESULT_SUCCESS: await load(REAL, 'result-success.jsonl'),
  RESULT_ERROR: await load(REAL, 'result-error.jsonl'),
  RESULT_RESUME_NOT_FOUND: await load(SYNTHETIC, 'result-resume-not-found.jsonl'),
  STATUS: await load(REAL, 'status.jsonl'),
  TASK_STARTED: await load(REAL, 'task-started.jsonl'),
  STREAM_TEXT_DELTA: await load(REAL, 'stream-text-delta.jsonl'),
  STREAM_INPUT_JSON_DELTA: await load(REAL, 'stream-input-json-delta.jsonl'),
  STREAM_THINKING_DELTA: await load(REAL, 'stream-thinking-delta.jsonl'),
  STREAM_SIGNATURE_DELTA: await load(REAL, 'stream-signature-delta.jsonl'),
  STREAM_CONTENT_BLOCK_START: await load(REAL, 'stream-content-block-start.jsonl'),
  STREAM_CONTENT_BLOCK_STOP: await load(REAL, 'stream-content-block-stop.jsonl'),
  STREAM_MESSAGE_START: await load(REAL, 'stream-message-start.jsonl'),
  STREAM_MESSAGE_DELTA: await load(REAL, 'stream-message-delta.jsonl'),
  STREAM_MESSAGE_STOP: await load(REAL, 'stream-message-stop.jsonl'),
  RATE_LIMIT_EVENT: await load(REAL, 'rate-limit-event.jsonl'),
  HOOK_STARTED: await load(REAL, 'hook-started.jsonl'),
  HOOK_RESPONSE: await load(REAL, 'hook-response.jsonl'),
  TOOL_USE: await load(REAL, 'tool-use.jsonl'),
  AGENT_TOOL: await load(REAL, 'assistant-agent.jsonl'),
  // synthetic — event types not yet captured from real CLI sessions
  // TODO: replace with real DB fixture when captured
  CONTROL_REQUEST_OPEN_DIFF: await load(SYNTHETIC, 'control-request-open-diff.jsonl'),
  // TODO: replace with real DB fixture when open_in_editor is captured
  CONTROL_REQUEST_OPEN_IN_EDITOR: await load(SYNTHETIC, 'control-request-open-in-editor.jsonl'),
  // TODO: replace with real DB fixture when speech_to_text_message is captured
  SPEECH_TO_TEXT_MESSAGE: await load(SYNTHETIC, 'speech-to-text-message.jsonl'),
  // TODO: replace with real DB fixture when notification is captured
  NOTIFICATION: await load(SYNTHETIC, 'notification.jsonl'),
  // TODO: replace with real DB fixture when new_session_notification is captured
  NEW_SESSION_NOTIFICATION: await load(SYNTHETIC, 'new-session-notification.jsonl'),
  // TODO: replace with real DB fixture when captured
  CONTROL_REQUEST_ELICITATION: await load(SYNTHETIC, 'control-request-elicitation.jsonl'),
  CONTROL_REQUEST_SHOW_NOTIFICATION: await load(
    SYNTHETIC,
    'control-request-show-notification.jsonl',
  ),
  STREAMLINED_TEXT: await load(SYNTHETIC, 'streamlined-text.jsonl'),
  STREAMLINED_TOOL_USE_SUMMARY: await load(SYNTHETIC, 'streamlined-tool-use-summary.jsonl'),
  CITATIONS_DELTA: await load(SYNTHETIC, 'citations-delta.jsonl'),
  THINKING_DELTA_LEGACY: await load(SYNTHETIC, 'stream-thinking-delta-legacy.jsonl'),
  TASK_NOTIFICATION: await load(REAL, 'task-notification.jsonl'),
  TASK_PROGRESS: await load(REAL, 'task-progress.jsonl'),
  CLI_ERROR: await load(REAL, 'cli-error.jsonl'),
  BRIDGE_STATE: await load(SYNTHETIC, 'bridge-state.jsonl'),
  COMPACT_BOUNDARY: await load(SYNTHETIC, 'compact-boundary.jsonl'),
  EXPERIMENT_GATES: await load(SYNTHETIC, 'experiment-gates.jsonl'),
  AUTH_STATUS: await load(REAL, 'auth-status.jsonl'),
  // TODO: replace with real DB fixture when auth_url is captured from a real CLI session
  AUTH_URL: await load(SYNTHETIC, 'auth-url.jsonl'),
  // TODO: replace with real DB fixture when an unknown event type is captured
  UNKNOWN_EVENT: await load(SYNTHETIC, 'unknown-event.jsonl'),
  // TODO: replace with real DB fixture when mirror_error is captured
  SYSTEM_MIRROR_ERROR: await load(SYNTHETIC, 'system-mirror-error.jsonl'),
  CONTROL_SEED_READ_STATE: await load(SYNTHETIC, 'control-seed-read-state.jsonl'),
  CONTROL_CHANNEL_ENABLE: await load(SYNTHETIC, 'control-channel-enable.jsonl'),
} as const;

const _s = createSegments(TEMPLATES);
export const segments: SegmentBuilders = _s.segments;
export const resetSeq: () => void = _s.resetSeq;
