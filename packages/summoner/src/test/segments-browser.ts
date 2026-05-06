// Browser-compatible segment builders — uses ?raw imports (Vite inlines at build time)
// Import this entry in Storybook / browser contexts instead of segments-node.ts
import AGENT_TOOL from '../__fixtures__/claude/real/assistant-agent.jsonl?raw';
import ASSISTANT_TEXT from '../__fixtures__/claude/real/assistant-text.jsonl?raw';
import ASSISTANT_TOOL from '../__fixtures__/claude/real/assistant-tool.jsonl?raw';
import AUTH_STATUS from '../__fixtures__/claude/real/auth-status.jsonl?raw';
import CLI_ERROR from '../__fixtures__/claude/real/cli-error.jsonl?raw';
import CONTROL_CANCEL_REQUEST from '../__fixtures__/claude/real/control-cancel-request.jsonl?raw';
import CONTROL_REQUEST from '../__fixtures__/claude/real/control-request.jsonl?raw';
import CONTROL_REQUEST_ASK_USER_QUESTION from '../__fixtures__/claude/real/control-request-ask-user-question.jsonl?raw';
import CONTROL_REQUEST_BASH from '../__fixtures__/claude/real/control-request-bash.jsonl?raw';
import CONTROL_REQUEST_EXIT_PLAN_MODE from '../__fixtures__/claude/real/control-request-exit-plan-mode.jsonl?raw';
import CONTROL_RESPONSE from '../__fixtures__/claude/real/control-response.jsonl?raw';
import CONTROL_RESPONSE_ERROR from '../__fixtures__/claude/real/control-response-error.jsonl?raw';
import HOOK_RESPONSE from '../__fixtures__/claude/real/hook-response.jsonl?raw';
import HOOK_STARTED from '../__fixtures__/claude/real/hook-started.jsonl?raw';
import INIT from '../__fixtures__/claude/real/init.jsonl?raw';
import RATE_LIMIT_EVENT from '../__fixtures__/claude/real/rate-limit-event.jsonl?raw';
import RESULT_ERROR from '../__fixtures__/claude/real/result-error.jsonl?raw';
import RESULT_IS_ERROR_NO_ERRORS from '../__fixtures__/claude/real/result-is-error-no-errors.jsonl?raw';
import RESULT_SUCCESS from '../__fixtures__/claude/real/result-success.jsonl?raw';
import STATUS from '../__fixtures__/claude/real/status.jsonl?raw';
import STREAM_CONTENT_BLOCK_START from '../__fixtures__/claude/real/stream-content-block-start.jsonl?raw';
import STREAM_CONTENT_BLOCK_STOP from '../__fixtures__/claude/real/stream-content-block-stop.jsonl?raw';
import STREAM_INPUT_JSON_DELTA from '../__fixtures__/claude/real/stream-input-json-delta.jsonl?raw';
import STREAM_MESSAGE_DELTA from '../__fixtures__/claude/real/stream-message-delta.jsonl?raw';
import STREAM_MESSAGE_START from '../__fixtures__/claude/real/stream-message-start.jsonl?raw';
import STREAM_MESSAGE_STOP from '../__fixtures__/claude/real/stream-message-stop.jsonl?raw';
import STREAM_SIGNATURE_DELTA from '../__fixtures__/claude/real/stream-signature-delta.jsonl?raw';
import STREAM_TEXT_DELTA from '../__fixtures__/claude/real/stream-text-delta.jsonl?raw';
import STREAM_THINKING_DELTA from '../__fixtures__/claude/real/stream-thinking-delta.jsonl?raw';
import TASK_NOTIFICATION from '../__fixtures__/claude/real/task-notification.jsonl?raw';
import TASK_PROGRESS from '../__fixtures__/claude/real/task-progress.jsonl?raw';
import TASK_STARTED from '../__fixtures__/claude/real/task-started.jsonl?raw';
import THINKING from '../__fixtures__/claude/real/thinking.jsonl?raw';
import TOOL_RESULT from '../__fixtures__/claude/real/tool-result.jsonl?raw';
import TOOL_USE from '../__fixtures__/claude/real/tool-use.jsonl?raw';
import USER_SKILL_BODY from '../__fixtures__/claude/real/user-skill-body.jsonl?raw';
import USER_TEXT from '../__fixtures__/claude/real/user-text.jsonl?raw';
import AUTH_URL from '../__fixtures__/claude/synthetic/auth-url.jsonl?raw';
import BRIDGE_STATE from '../__fixtures__/claude/synthetic/bridge-state.jsonl?raw';
import CITATIONS_DELTA from '../__fixtures__/claude/synthetic/citations-delta.jsonl?raw';
import COMPACT_BOUNDARY from '../__fixtures__/claude/synthetic/compact-boundary.jsonl?raw';
import CONTROL_CHANNEL_ENABLE from '../__fixtures__/claude/synthetic/control-channel-enable.jsonl?raw';
import CONTROL_REQUEST_ELICITATION from '../__fixtures__/claude/synthetic/control-request-elicitation.jsonl?raw';
import CONTROL_REQUEST_OPEN_DIFF from '../__fixtures__/claude/synthetic/control-request-open-diff.jsonl?raw';
import CONTROL_REQUEST_OPEN_IN_EDITOR from '../__fixtures__/claude/synthetic/control-request-open-in-editor.jsonl?raw';
import CONTROL_REQUEST_SHOW_NOTIFICATION from '../__fixtures__/claude/synthetic/control-request-show-notification.jsonl?raw';
import CONTROL_SEED_READ_STATE from '../__fixtures__/claude/synthetic/control-seed-read-state.jsonl?raw';
import EXPERIMENT_GATES from '../__fixtures__/claude/synthetic/experiment-gates.jsonl?raw';
import NEW_SESSION_NOTIFICATION from '../__fixtures__/claude/synthetic/new-session-notification.jsonl?raw';
import NOTIFICATION from '../__fixtures__/claude/synthetic/notification.jsonl?raw';
import RESULT_RESUME_NOT_FOUND from '../__fixtures__/claude/synthetic/result-resume-not-found.jsonl?raw';
import SPEECH_TO_TEXT_MESSAGE from '../__fixtures__/claude/synthetic/speech-to-text-message.jsonl?raw';
import THINKING_DELTA_LEGACY from '../__fixtures__/claude/synthetic/stream-thinking-delta-legacy.jsonl?raw';
import STREAMLINED_TEXT from '../__fixtures__/claude/synthetic/streamlined-text.jsonl?raw';
import STREAMLINED_TOOL_USE_SUMMARY from '../__fixtures__/claude/synthetic/streamlined-tool-use-summary.jsonl?raw';
import SYSTEM_MIRROR_ERROR from '../__fixtures__/claude/synthetic/system-mirror-error.jsonl?raw';
import UNKNOWN_EVENT from '../__fixtures__/claude/synthetic/unknown-event.jsonl?raw';
import { createSegments, type SegmentBuilders } from './segment-builders.ts';

const _s = createSegments({
  INIT,
  ASSISTANT_TEXT,
  ASSISTANT_TOOL,
  THINKING,
  CONTROL_REQUEST,
  CONTROL_REQUEST_BASH,
  CONTROL_REQUEST_ASK_USER_QUESTION,
  CONTROL_REQUEST_EXIT_PLAN_MODE,
  CONTROL_RESPONSE,
  CONTROL_RESPONSE_ERROR,
  CONTROL_CANCEL_REQUEST,
  TOOL_RESULT,
  USER_TEXT,
  USER_SKILL_BODY,
  RESULT_SUCCESS,
  RESULT_ERROR,
  RESULT_IS_ERROR_NO_ERRORS,
  RESULT_RESUME_NOT_FOUND,
  STATUS,
  TASK_STARTED,
  STREAM_TEXT_DELTA,
  STREAM_INPUT_JSON_DELTA,
  STREAM_THINKING_DELTA,
  STREAM_SIGNATURE_DELTA,
  STREAM_CONTENT_BLOCK_START,
  STREAM_CONTENT_BLOCK_STOP,
  STREAM_MESSAGE_START,
  STREAM_MESSAGE_DELTA,
  STREAM_MESSAGE_STOP,
  RATE_LIMIT_EVENT,
  HOOK_STARTED,
  HOOK_RESPONSE,
  TOOL_USE,
  AGENT_TOOL,
  CONTROL_REQUEST_OPEN_DIFF,
  CONTROL_REQUEST_OPEN_IN_EDITOR,
  SPEECH_TO_TEXT_MESSAGE,
  NOTIFICATION,
  NEW_SESSION_NOTIFICATION,
  CONTROL_REQUEST_ELICITATION,
  CONTROL_REQUEST_SHOW_NOTIFICATION,
  STREAMLINED_TEXT,
  STREAMLINED_TOOL_USE_SUMMARY,
  CITATIONS_DELTA,
  THINKING_DELTA_LEGACY,
  TASK_NOTIFICATION,
  TASK_PROGRESS,
  CLI_ERROR,
  BRIDGE_STATE,
  COMPACT_BOUNDARY,
  EXPERIMENT_GATES,
  AUTH_STATUS,
  AUTH_URL,
  UNKNOWN_EVENT,
  SYSTEM_MIRROR_ERROR,
  CONTROL_SEED_READ_STATE,
  CONTROL_CHANNEL_ENABLE,
});
export const segments: SegmentBuilders = _s.segments;
export const resetSeq: () => void = _s.resetSeq;
