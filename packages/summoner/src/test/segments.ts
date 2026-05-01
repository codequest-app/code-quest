// real fixtures

import AGENT_TOOL_RAW from '../__fixtures__/claude/real/assistant-agent.jsonl?raw';
import ASSISTANT_TEXT_RAW from '../__fixtures__/claude/real/assistant-text.jsonl?raw';
import ASSISTANT_TOOL_RAW from '../__fixtures__/claude/real/assistant-tool.jsonl?raw';
import AUTH_STATUS_RAW from '../__fixtures__/claude/real/auth-status.jsonl?raw';
import CLI_ERROR_RAW from '../__fixtures__/claude/real/cli-error.jsonl?raw';
import CONTROL_CANCEL_REQUEST_RAW from '../__fixtures__/claude/real/control-cancel-request.jsonl?raw';
import CONTROL_REQUEST_RAW from '../__fixtures__/claude/real/control-request.jsonl?raw';
import CONTROL_REQUEST_ASK_USER_QUESTION_RAW from '../__fixtures__/claude/real/control-request-ask-user-question.jsonl?raw';
import CONTROL_REQUEST_BASH_RAW from '../__fixtures__/claude/real/control-request-bash.jsonl?raw';
import CONTROL_REQUEST_EXIT_PLAN_MODE_RAW from '../__fixtures__/claude/real/control-request-exit-plan-mode.jsonl?raw';
import CONTROL_RESPONSE_RAW from '../__fixtures__/claude/real/control-response.jsonl?raw';
import CONTROL_RESPONSE_ERROR_RAW from '../__fixtures__/claude/real/control-response-error.jsonl?raw';
import HOOK_RESPONSE_RAW from '../__fixtures__/claude/real/hook-response.jsonl?raw';
import HOOK_STARTED_RAW from '../__fixtures__/claude/real/hook-started.jsonl?raw';
import INIT_RAW from '../__fixtures__/claude/real/init.jsonl?raw';
import RATE_LIMIT_EVENT_RAW from '../__fixtures__/claude/real/rate-limit-event.jsonl?raw';
import RESULT_ERROR_RAW from '../__fixtures__/claude/real/result-error.jsonl?raw';
import RESULT_SUCCESS_RAW from '../__fixtures__/claude/real/result-success.jsonl?raw';
import STATUS_RAW from '../__fixtures__/claude/real/status.jsonl?raw';
import STREAM_CONTENT_BLOCK_START_RAW from '../__fixtures__/claude/real/stream-content-block-start.jsonl?raw';
import STREAM_CONTENT_BLOCK_STOP_RAW from '../__fixtures__/claude/real/stream-content-block-stop.jsonl?raw';
import STREAM_INPUT_JSON_DELTA_RAW from '../__fixtures__/claude/real/stream-input-json-delta.jsonl?raw';
import STREAM_MESSAGE_DELTA_RAW from '../__fixtures__/claude/real/stream-message-delta.jsonl?raw';
import STREAM_MESSAGE_START_RAW from '../__fixtures__/claude/real/stream-message-start.jsonl?raw';
import STREAM_MESSAGE_STOP_RAW from '../__fixtures__/claude/real/stream-message-stop.jsonl?raw';
import STREAM_SIGNATURE_DELTA_RAW from '../__fixtures__/claude/real/stream-signature-delta.jsonl?raw';
import STREAM_TEXT_DELTA_RAW from '../__fixtures__/claude/real/stream-text-delta.jsonl?raw';
import STREAM_THINKING_DELTA_RAW from '../__fixtures__/claude/real/stream-thinking-delta.jsonl?raw';
import TASK_NOTIFICATION_RAW from '../__fixtures__/claude/real/task-notification.jsonl?raw';
import TASK_PROGRESS_RAW from '../__fixtures__/claude/real/task-progress.jsonl?raw';
import TASK_STARTED_RAW from '../__fixtures__/claude/real/task-started.jsonl?raw';
import THINKING_RAW from '../__fixtures__/claude/real/thinking.jsonl?raw';
import TOOL_RESULT_RAW from '../__fixtures__/claude/real/tool-result.jsonl?raw';
import TOOL_USE_RAW from '../__fixtures__/claude/real/tool-use.jsonl?raw';
import USER_TEXT_RAW from '../__fixtures__/claude/real/user-text.jsonl?raw';
import AUTH_URL_RAW from '../__fixtures__/claude/synthetic/auth-url.jsonl?raw';
import BRIDGE_STATE_RAW from '../__fixtures__/claude/synthetic/bridge-state.jsonl?raw';
import CITATIONS_DELTA_RAW from '../__fixtures__/claude/synthetic/citations-delta.jsonl?raw';
import COMPACT_BOUNDARY_RAW from '../__fixtures__/claude/synthetic/compact-boundary.jsonl?raw';
import CONTROL_CHANNEL_ENABLE_RAW from '../__fixtures__/claude/synthetic/control-channel-enable.jsonl?raw';
import CONTROL_REQUEST_ELICITATION_RAW from '../__fixtures__/claude/synthetic/control-request-elicitation.jsonl?raw';
import CONTROL_REQUEST_OPEN_DIFF_RAW from '../__fixtures__/claude/synthetic/control-request-open-diff.jsonl?raw';
import CONTROL_REQUEST_OPEN_IN_EDITOR_RAW from '../__fixtures__/claude/synthetic/control-request-open-in-editor.jsonl?raw';
import CONTROL_REQUEST_SHOW_NOTIFICATION_RAW from '../__fixtures__/claude/synthetic/control-request-show-notification.jsonl?raw';
import CONTROL_SEED_READ_STATE_RAW from '../__fixtures__/claude/synthetic/control-seed-read-state.jsonl?raw';
import EXPERIMENT_GATES_RAW from '../__fixtures__/claude/synthetic/experiment-gates.jsonl?raw';
import NEW_SESSION_NOTIFICATION_RAW from '../__fixtures__/claude/synthetic/new-session-notification.jsonl?raw';
import NOTIFICATION_RAW from '../__fixtures__/claude/synthetic/notification.jsonl?raw';
// synthetic — event types not yet captured from real CLI sessions
import RESULT_RESUME_NOT_FOUND_RAW from '../__fixtures__/claude/synthetic/result-resume-not-found.jsonl?raw';
import SPEECH_TO_TEXT_MESSAGE_RAW from '../__fixtures__/claude/synthetic/speech-to-text-message.jsonl?raw';
import THINKING_DELTA_LEGACY_RAW from '../__fixtures__/claude/synthetic/stream-thinking-delta-legacy.jsonl?raw';
import STREAMLINED_TEXT_RAW from '../__fixtures__/claude/synthetic/streamlined-text.jsonl?raw';
import STREAMLINED_TOOL_USE_SUMMARY_RAW from '../__fixtures__/claude/synthetic/streamlined-tool-use-summary.jsonl?raw';
import SYSTEM_MIRROR_ERROR_RAW from '../__fixtures__/claude/synthetic/system-mirror-error.jsonl?raw';
import UNKNOWN_EVENT_RAW from '../__fixtures__/claude/synthetic/unknown-event.jsonl?raw';

const TEMPLATES = {
  INIT: INIT_RAW.trim(),
  ASSISTANT_TEXT: ASSISTANT_TEXT_RAW.trim(),
  ASSISTANT_TOOL: ASSISTANT_TOOL_RAW.trim(),
  THINKING: THINKING_RAW.trim(),
  CONTROL_REQUEST: CONTROL_REQUEST_RAW.trim(),
  CONTROL_REQUEST_BASH: CONTROL_REQUEST_BASH_RAW.trim(),
  CONTROL_REQUEST_ASK_USER_QUESTION: CONTROL_REQUEST_ASK_USER_QUESTION_RAW.trim(),
  CONTROL_REQUEST_EXIT_PLAN_MODE: CONTROL_REQUEST_EXIT_PLAN_MODE_RAW.trim(),
  CONTROL_RESPONSE: CONTROL_RESPONSE_RAW.trim(),
  CONTROL_RESPONSE_ERROR: CONTROL_RESPONSE_ERROR_RAW.trim(),
  CONTROL_CANCEL_REQUEST: CONTROL_CANCEL_REQUEST_RAW.trim(),
  TOOL_RESULT: TOOL_RESULT_RAW.trim(),
  USER_TEXT: USER_TEXT_RAW.trim(),
  RESULT_SUCCESS: RESULT_SUCCESS_RAW.trim(),
  RESULT_ERROR: RESULT_ERROR_RAW.trim(),
  RESULT_RESUME_NOT_FOUND: RESULT_RESUME_NOT_FOUND_RAW.trim(),
  STATUS: STATUS_RAW.trim(),
  TASK_STARTED: TASK_STARTED_RAW.trim(),
  STREAM_TEXT_DELTA: STREAM_TEXT_DELTA_RAW.trim(),
  STREAM_INPUT_JSON_DELTA: STREAM_INPUT_JSON_DELTA_RAW.trim(),
  STREAM_THINKING_DELTA: STREAM_THINKING_DELTA_RAW.trim(),
  STREAM_SIGNATURE_DELTA: STREAM_SIGNATURE_DELTA_RAW.trim(),
  STREAM_CONTENT_BLOCK_START: STREAM_CONTENT_BLOCK_START_RAW.trim(),
  STREAM_CONTENT_BLOCK_STOP: STREAM_CONTENT_BLOCK_STOP_RAW.trim(),
  STREAM_MESSAGE_START: STREAM_MESSAGE_START_RAW.trim(),
  STREAM_MESSAGE_DELTA: STREAM_MESSAGE_DELTA_RAW.trim(),
  STREAM_MESSAGE_STOP: STREAM_MESSAGE_STOP_RAW.trim(),
  RATE_LIMIT_EVENT: RATE_LIMIT_EVENT_RAW.trim(),
  HOOK_STARTED: HOOK_STARTED_RAW.trim(),
  HOOK_RESPONSE: HOOK_RESPONSE_RAW.trim(),
  TOOL_USE: TOOL_USE_RAW.trim(),
  AGENT_TOOL: AGENT_TOOL_RAW.trim(),
  // synthetic — event types not yet captured from real CLI sessions
  // TODO: replace with real DB fixture when captured
  CONTROL_REQUEST_OPEN_DIFF: CONTROL_REQUEST_OPEN_DIFF_RAW.trim(),
  // TODO: replace with real DB fixture when open_in_editor is captured
  CONTROL_REQUEST_OPEN_IN_EDITOR: CONTROL_REQUEST_OPEN_IN_EDITOR_RAW.trim(),
  // TODO: replace with real DB fixture when speech_to_text_message is captured
  SPEECH_TO_TEXT_MESSAGE: SPEECH_TO_TEXT_MESSAGE_RAW.trim(),
  // TODO: replace with real DB fixture when notification is captured
  NOTIFICATION: NOTIFICATION_RAW.trim(),
  // TODO: replace with real DB fixture when new_session_notification is captured
  NEW_SESSION_NOTIFICATION: NEW_SESSION_NOTIFICATION_RAW.trim(),
  // TODO: replace with real DB fixture when captured
  CONTROL_REQUEST_ELICITATION: CONTROL_REQUEST_ELICITATION_RAW.trim(),
  CONTROL_REQUEST_SHOW_NOTIFICATION: CONTROL_REQUEST_SHOW_NOTIFICATION_RAW.trim(),
  STREAMLINED_TEXT: STREAMLINED_TEXT_RAW.trim(),
  STREAMLINED_TOOL_USE_SUMMARY: STREAMLINED_TOOL_USE_SUMMARY_RAW.trim(),
  CITATIONS_DELTA: CITATIONS_DELTA_RAW.trim(),
  THINKING_DELTA_LEGACY: THINKING_DELTA_LEGACY_RAW.trim(),
  TASK_NOTIFICATION: TASK_NOTIFICATION_RAW.trim(),
  TASK_PROGRESS: TASK_PROGRESS_RAW.trim(),
  CLI_ERROR: CLI_ERROR_RAW.trim(),
  BRIDGE_STATE: BRIDGE_STATE_RAW.trim(),
  COMPACT_BOUNDARY: COMPACT_BOUNDARY_RAW.trim(),
  EXPERIMENT_GATES: EXPERIMENT_GATES_RAW.trim(),
  AUTH_STATUS: AUTH_STATUS_RAW.trim(),
  // TODO: replace with real DB fixture when auth_url is captured from a real CLI session
  AUTH_URL: AUTH_URL_RAW.trim(),
  // TODO: replace with real DB fixture when an unknown event type is captured
  UNKNOWN_EVENT: UNKNOWN_EVENT_RAW.trim(),
  // TODO: replace with real DB fixture when mirror_error is captured
  SYSTEM_MIRROR_ERROR: SYSTEM_MIRROR_ERROR_RAW.trim(),
  CONTROL_SEED_READ_STATE: CONTROL_SEED_READ_STATE_RAW.trim(),
  CONTROL_CHANNEL_ENABLE: CONTROL_CHANNEL_ENABLE_RAW.trim(),
} as const;

// ── Segment builders ──

let _seq = 0;

export function resetSeq(): void {
  _seq = 0;
}

/** Clone a template, apply overrides, and return as JSON string */
function fromTemplate(template: string, overrides: Record<string, unknown>): string {
  const line = JSON.parse(template);
  Object.assign(line, overrides);
  return JSON.stringify(line);
}

export const segments = {
  init(
    sessionId: string,
    opts?: {
      model?: string;
      tools?: string[];
      permissionMode?: string;
      fastModeState?: string;
      mcpServers?: Array<{ name: string; status: string; scope?: string }>;
      slashCommands?: string[];
      currentRepo?: { branch: string; isClean: boolean };
    },
  ): string {
    const line = JSON.parse(TEMPLATES.INIT);
    line.session_id = sessionId;
    line.uuid = `fake-init-${++_seq}`;
    if (opts?.model) line.model = opts.model;
    if (opts?.tools) line.tools = opts.tools;
    if (opts?.permissionMode) line.permissionMode = opts.permissionMode;
    if (opts?.fastModeState !== undefined) line.fast_mode_state = opts.fastModeState;
    if (opts?.mcpServers) line.mcp_servers = opts.mcpServers;
    if (opts?.slashCommands) line.slash_commands = opts.slashCommands;
    if (opts?.currentRepo)
      line.current_repo = { branch: opts.currentRepo.branch, is_clean: opts.currentRepo.isClean };
    return JSON.stringify(line);
  },

  /** Real CLI user-echo segment (text). Override uuid via opts to use a known id (for fork tests). */
  user(text: string, opts?: { uuid?: string }): string {
    const line = JSON.parse(TEMPLATES.USER_TEXT);
    line.message.content[0].text = text;
    line.uuid = opts?.uuid ?? `fake-user-${++_seq}`;
    return JSON.stringify(line);
  },

  assistant(
    textOrOpts: string | { toolUse: { id: string; name: string; input: unknown } },
    opts?: { parentToolUseId?: string },
  ): string {
    if (typeof textOrOpts === 'string') {
      const line = JSON.parse(TEMPLATES.ASSISTANT_TEXT);
      line.message.content[0].text = textOrOpts;
      line.message.id = `msg_fake_${++_seq}`;
      line.uuid = `fake-asst-${_seq}`;
      if (opts?.parentToolUseId) line.parent_tool_use_id = opts.parentToolUseId;
      return JSON.stringify(line);
    }

    const { id, name, input } = textOrOpts.toolUse;
    const line = JSON.parse(TEMPLATES.ASSISTANT_TOOL);
    line.message.content[0].id = id;
    line.message.content[0].name = name;
    line.message.content[0].input = input;
    line.message.id = `msg_fake_${++_seq}`;
    line.uuid = `fake-asst-${_seq}`;
    if (opts?.parentToolUseId) line.parent_tool_use_id = opts.parentToolUseId;
    return JSON.stringify(line);
  },

  thinking(text: string, opts?: { parentToolUseId?: string }): string {
    const line = JSON.parse(TEMPLATES.THINKING);
    line.message.content[0].thinking = text;
    line.message.id = `msg_fake_${++_seq}`;
    line.uuid = `fake-asst-${_seq}`;
    if (opts?.parentToolUseId) line.parent_tool_use_id = opts.parentToolUseId;
    return JSON.stringify(line);
  },

  controlRequest(requestId: string, subtype: string, toolName?: string, input?: unknown): string {
    const line = JSON.parse(TEMPLATES.CONTROL_REQUEST);
    line.request_id = requestId;
    line.request.subtype = subtype;
    if (toolName !== undefined) line.request.tool_name = toolName;
    if (input !== undefined) line.request.input = input;
    line.request.tool_use_id = `toolu_fake_${++_seq}`;
    return JSON.stringify(line);
  },

  /** control_request for Bash tool — uses real Bash fixture */
  controlRequestBash(requestId: string, input: { command: string; description?: string }): string {
    const line = JSON.parse(TEMPLATES.CONTROL_REQUEST_BASH);
    line.request_id = requestId;
    line.request.input = input;
    line.request.tool_use_id = `toolu_fake_${++_seq}`;
    return JSON.stringify(line);
  },

  /** control_request for AskUserQuestion — uses real fixture */
  controlRequestAskUserQuestion(requestId: string, input: { questions: unknown[] }): string {
    const line = JSON.parse(TEMPLATES.CONTROL_REQUEST_ASK_USER_QUESTION);
    line.request_id = requestId;
    line.request.input = input;
    line.request.tool_use_id = `toolu_fake_${++_seq}`;
    return JSON.stringify(line);
  },

  /** control_request for ExitPlanMode — uses real fixture */
  controlRequestExitPlanMode(requestId: string, input?: Record<string, unknown>): string {
    const line = JSON.parse(TEMPLATES.CONTROL_REQUEST_EXIT_PLAN_MODE);
    line.request_id = requestId;
    if (input !== undefined) line.request.input = input;
    line.request.tool_use_id = `toolu_fake_${++_seq}`;
    return JSON.stringify(line);
  },

  /**
   * control_request for open_diff — synthetic fixture (TODO: replace with real DB capture)
   * input: { originalFilePath, newFilePath, edits, supportMultiEdits }
   */
  controlRequestOpenDiff(
    requestId: string,
    input: {
      originalFilePath: string;
      newFilePath: string;
      edits?: unknown[];
      supportMultiEdits?: boolean;
    },
  ): string {
    const line = JSON.parse(TEMPLATES.CONTROL_REQUEST_OPEN_DIFF);
    line.request_id = requestId;
    line.request.input = { supportMultiEdits: false, edits: [], ...input };
    line.request.tool_use_id = `toolu_fake_${++_seq}`;
    return JSON.stringify(line);
  },

  /**
   * control_request for elicitation — synthetic fixture (TODO: replace with real DB capture)
   * input: { message, requestedSchema }
   */
  controlRequestElicitation(
    requestId: string,
    input: {
      message: string;
      requestedSchema?: Record<string, unknown>;
      mode?: 'text' | 'url' | 'form';
      url?: string;
    },
  ): string {
    const line = JSON.parse(TEMPLATES.CONTROL_REQUEST_ELICITATION);
    line.request_id = requestId;
    // Real CLI uses snake_case field names; normalize camelCase requestedSchema → requested_schema
    const { requestedSchema, ...rest } = input;
    line.request.input =
      requestedSchema !== undefined ? { ...rest, requested_schema: requestedSchema } : rest;
    line.request.tool_use_id = `toolu_fake_${++_seq}`;
    return JSON.stringify(line);
  },

  toolResult(toolUseId: string, content: string, opts?: { parentToolUseId?: string }): string {
    const line = JSON.parse(TEMPLATES.TOOL_RESULT);
    line.message.content[0].tool_use_id = toolUseId;
    line.message.content[0].content = content;
    delete line.message.content[0].is_error;
    line.uuid = `fake-tr-${++_seq}`;
    if (opts?.parentToolUseId) line.parent_tool_use_id = opts.parentToolUseId;
    return JSON.stringify(line);
  },

  controlResponse(requestId: string, response?: Record<string, unknown>): string {
    const line = JSON.parse(TEMPLATES.CONTROL_RESPONSE);
    line.response.request_id = requestId;
    if (response !== undefined) line.response.response = response;
    return JSON.stringify(line);
  },

  controlResponseError(requestId: string, error: string): string {
    const line = JSON.parse(TEMPLATES.CONTROL_RESPONSE_ERROR);
    line.response.request_id = requestId;
    line.response.error = error;
    return JSON.stringify(line);
  },

  controlCancelRequest(requestId: string): string {
    return fromTemplate(TEMPLATES.CONTROL_CANCEL_REQUEST, { request_id: requestId });
  },

  status(opts: { status?: string | null; permissionMode?: string }): string {
    const line = JSON.parse(TEMPLATES.STATUS);
    line.status = opts.status ?? null;
    if (opts.permissionMode !== undefined) line.permissionMode = opts.permissionMode;
    line.uuid = `fake-status-${++_seq}`;
    return JSON.stringify(line);
  },

  taskStarted(toolUseId: string, description: string): string {
    const line = JSON.parse(TEMPLATES.TASK_STARTED);
    line.tool_use_id = toolUseId;
    line.description = description;
    line.task_id = `fake-task-${++_seq}`;
    line.uuid = `fake-task-started-${_seq}`;
    return JSON.stringify(line);
  },

  taskNotification(
    taskId: string,
    opts?: {
      toolUseId?: string;
      status?: string;
      outputFile?: string;
      summary?: string;
      usage?: Record<string, unknown>;
    },
  ): string {
    const line = JSON.parse(TEMPLATES.TASK_NOTIFICATION);
    line.task_id = taskId;
    if (opts?.toolUseId) line.tool_use_id = opts.toolUseId;
    if (opts?.status) line.status = opts.status;
    if (opts?.outputFile) line.output_file = opts.outputFile;
    if (opts?.summary) line.summary = opts.summary;
    if (opts?.usage) line.usage = opts.usage;
    line.uuid = `fake-task-notif-${++_seq}`;
    return JSON.stringify(line);
  },

  taskProgress(
    taskId: string,
    opts?: {
      toolUseId?: string;
      description?: string;
      lastToolName?: string;
      usage?: Record<string, unknown>;
    },
  ): string {
    const line = JSON.parse(TEMPLATES.TASK_PROGRESS);
    line.task_id = taskId;
    if (opts?.toolUseId) line.tool_use_id = opts.toolUseId;
    if (opts?.description) line.description = opts.description;
    if (opts?.lastToolName) line.last_tool_name = opts.lastToolName;
    if (opts?.usage) line.usage = opts.usage;
    line.uuid = `fake-task-progress-${++_seq}`;
    return JSON.stringify(line);
  },

  resultError(opts?: {
    durationMs?: number;
    costUsd?: number;
    errors?: string[];
    terminalReason?: string;
  }): string {
    const line = JSON.parse(
      opts?.errors ? TEMPLATES.RESULT_RESUME_NOT_FOUND : TEMPLATES.RESULT_ERROR,
    );
    if (opts?.durationMs != null) {
      line.duration_ms = opts.durationMs;
      line.duration_api_ms = opts.durationMs;
    }
    if (opts?.costUsd != null) line.total_cost_usd = opts.costUsd;
    if (opts?.errors != null) line.errors = opts.errors;
    if (opts?.terminalReason != null) line.terminal_reason = opts.terminalReason;
    line.uuid = `fake-result-err-${++_seq}`;
    return JSON.stringify(line);
  },

  // ── Stream event builders ──

  textDelta(text: string, opts?: { index?: number; parentToolUseId?: string }): string {
    const line = JSON.parse(TEMPLATES.STREAM_TEXT_DELTA);
    line.event.delta.text = text;
    if (opts?.index != null) line.event.index = opts.index;
    if (opts?.parentToolUseId) line.parent_tool_use_id = opts.parentToolUseId;
    line.uuid = `fake-text-delta-${++_seq}`;
    return JSON.stringify(line);
  },

  inputJsonDelta(partialJson: string, opts?: { index?: number; parentToolUseId?: string }): string {
    const line = JSON.parse(TEMPLATES.STREAM_INPUT_JSON_DELTA);
    line.event.delta.partial_json = partialJson;
    if (opts?.index != null) line.event.index = opts.index;
    if (opts?.parentToolUseId) line.parent_tool_use_id = opts.parentToolUseId;
    line.uuid = `fake-input-json-delta-${++_seq}`;
    return JSON.stringify(line);
  },

  thinkingDelta(thinking: string, opts?: { index?: number; parentToolUseId?: string }): string {
    const line = JSON.parse(TEMPLATES.STREAM_THINKING_DELTA);
    line.event.delta.thinking = thinking;
    if (opts?.index != null) line.event.index = opts.index;
    if (opts?.parentToolUseId) line.parent_tool_use_id = opts.parentToolUseId;
    line.uuid = `fake-thinking-delta-${++_seq}`;
    return JSON.stringify(line);
  },

  signatureDelta(signature: string, opts?: { index?: number; parentToolUseId?: string }): string {
    const line = JSON.parse(TEMPLATES.STREAM_SIGNATURE_DELTA);
    line.event.delta.signature = signature;
    if (opts?.index != null) line.event.index = opts.index;
    if (opts?.parentToolUseId) line.parent_tool_use_id = opts.parentToolUseId;
    line.uuid = `fake-sig-delta-${++_seq}`;
    return JSON.stringify(line);
  },

  contentBlockStart(
    index?: number,
    blockType?: string,
    opts?: { parentToolUseId?: string },
  ): string {
    const line = JSON.parse(TEMPLATES.STREAM_CONTENT_BLOCK_START);
    if (index !== undefined) line.event.index = index;
    if (blockType !== undefined) line.event.content_block = { type: blockType };
    if (opts?.parentToolUseId) line.parent_tool_use_id = opts.parentToolUseId;
    line.uuid = `fake-block-start-${++_seq}`;
    return JSON.stringify(line);
  },

  contentBlockStop(index: number, opts?: { parentToolUseId?: string }): string {
    const line = JSON.parse(TEMPLATES.STREAM_CONTENT_BLOCK_STOP);
    line.event.index = index;
    if (opts?.parentToolUseId) line.parent_tool_use_id = opts.parentToolUseId;
    line.uuid = `fake-block-stop-${++_seq}`;
    return JSON.stringify(line);
  },

  messageStart(opts?: { model?: string; parentToolUseId?: string }): string {
    const line = JSON.parse(TEMPLATES.STREAM_MESSAGE_START);
    if (opts?.model) line.event.message.model = opts.model;
    if (opts?.parentToolUseId) line.parent_tool_use_id = opts.parentToolUseId;
    line.uuid = `fake-msg-start-${++_seq}`;
    return JSON.stringify(line);
  },

  messageDelta(opts?: { stopReason?: string; parentToolUseId?: string }): string {
    const line = JSON.parse(TEMPLATES.STREAM_MESSAGE_DELTA);
    if (opts?.stopReason) line.event.delta.stop_reason = opts.stopReason;
    if (opts?.parentToolUseId) line.parent_tool_use_id = opts.parentToolUseId;
    line.uuid = `fake-msg-delta-${++_seq}`;
    return JSON.stringify(line);
  },

  messageStop(opts?: { parentToolUseId?: string }): string {
    const line = JSON.parse(TEMPLATES.STREAM_MESSAGE_STOP);
    if (opts?.parentToolUseId) line.parent_tool_use_id = opts.parentToolUseId;
    line.uuid = `fake-msg-stop-${++_seq}`;
    return JSON.stringify(line);
  },

  streamlinedText(text: string): string {
    const line = JSON.parse(TEMPLATES.STREAMLINED_TEXT);
    line.text = text;
    return JSON.stringify(line);
  },

  streamlinedToolUseSummary(toolSummary: string): string {
    const line = JSON.parse(TEMPLATES.STREAMLINED_TOOL_USE_SUMMARY);
    line.tool_summary = toolSummary;
    return JSON.stringify(line);
  },

  rateLimitEvent(opts?: {
    status?: string;
    rateLimitType?: string;
    resetsAt?: number;
    overageStatus?: string;
    isUsingOverage?: boolean;
  }): string {
    const line = JSON.parse(TEMPLATES.RATE_LIMIT_EVENT);
    if (opts?.status) line.rate_limit_info.status = opts.status;
    if (opts?.rateLimitType) line.rate_limit_info.rateLimitType = opts.rateLimitType;
    if (opts?.resetsAt !== undefined) line.rate_limit_info.resetsAt = opts.resetsAt;
    if (opts?.overageStatus !== undefined) line.rate_limit_info.overageStatus = opts.overageStatus;
    if (opts?.isUsingOverage !== undefined)
      line.rate_limit_info.isUsingOverage = opts.isUsingOverage;
    line.uuid = `fake-rate-limit-${++_seq}`;
    return JSON.stringify(line);
  },

  hookStarted(hookId?: string, hookName?: string, hookEvent?: string): string {
    const line = JSON.parse(TEMPLATES.HOOK_STARTED);
    if (hookId !== undefined) line.hook_id = hookId;
    if (hookName !== undefined) line.hook_name = hookName;
    if (hookEvent !== undefined) line.hook_event = hookEvent;
    line.uuid = `fake-hook-started-${++_seq}`;
    return JSON.stringify(line);
  },

  hookResponse(hookId: string, hookName: string, hookEvent: string, output?: string): string {
    const line = JSON.parse(TEMPLATES.HOOK_RESPONSE);
    line.hook_id = hookId;
    line.hook_name = hookName;
    line.hook_event = hookEvent;
    if (output !== undefined) line.output = output;
    line.uuid = `fake-hook-response-${++_seq}`;
    return JSON.stringify(line);
  },

  citationsDelta(citation: Record<string, unknown>, opts?: { index?: number }): string {
    const line = JSON.parse(TEMPLATES.CITATIONS_DELTA);
    line.event.delta.citation = citation;
    if (opts?.index != null) line.event.index = opts.index;
    return JSON.stringify(line);
  },

  thinkingDeltaLegacy(thinking: string, opts?: { index?: number }): string {
    const line = JSON.parse(TEMPLATES.THINKING_DELTA_LEGACY);
    line.event.delta.thinking = thinking;
    if (opts?.index != null) line.event.index = opts.index;
    return JSON.stringify(line);
  },

  compactBoundary(opts?: { preservedSegment?: boolean }): string {
    const line = JSON.parse(TEMPLATES.COMPACT_BOUNDARY);
    if (opts?.preservedSegment !== undefined) {
      line.compactMetadata = { preservedSegment: opts.preservedSegment };
    }
    return JSON.stringify(line);
  },

  bridgeState(state: 'ready' | 'disconnected' | 'error', detail?: string): string {
    const line = JSON.parse(TEMPLATES.BRIDGE_STATE);
    line.state = state;
    if (detail !== undefined) line.detail = detail;
    line.uuid = `fake-bridge-state-${++_seq}`;
    return JSON.stringify(line);
  },

  mirrorError(error: string, sessionId: string): string {
    const line = JSON.parse(TEMPLATES.SYSTEM_MIRROR_ERROR);
    line.error = error;
    line.session_id = sessionId;
    line.key = { sessionId };
    line.uuid = `fake-mirror-error-${++_seq}`;
    return JSON.stringify(line);
  },

  seedReadState(path: string, mtime: number): string {
    const line = JSON.parse(TEMPLATES.CONTROL_SEED_READ_STATE);
    line.request.path = path;
    line.request.mtime = mtime;
    line.request_id = `seed-read-${++_seq}`;
    return JSON.stringify(line);
  },

  channelEnable(serverName: string): string {
    const line = JSON.parse(TEMPLATES.CONTROL_CHANNEL_ENABLE);
    line.request.serverName = serverName;
    line.request_id = `channel-enable-${++_seq}`;
    return JSON.stringify(line);
  },

  error(message: string): string {
    const line = JSON.parse(TEMPLATES.CLI_ERROR);
    line.error.message = message;
    line.uuid = `fake-error-${++_seq}`;
    return JSON.stringify(line);
  },

  result(opts?: { durationMs?: number; costUsd?: number }): string {
    const line = JSON.parse(TEMPLATES.RESULT_SUCCESS);
    if (opts?.durationMs != null) {
      line.duration_ms = opts.durationMs;
      line.duration_api_ms = opts.durationMs;
    }
    if (opts?.costUsd != null) line.total_cost_usd = opts.costUsd;
    line.uuid = `fake-result-${++_seq}`;
    return JSON.stringify(line);
  },

  authUrl(url: string, method: string): string {
    const line = JSON.parse(TEMPLATES.AUTH_URL);
    line.url = url;
    line.method = method;
    line.uuid = `fake-auth-url-${++_seq}`;
    return JSON.stringify(line);
  },

  authStatus(
    status: string,
    opts?: { output?: string; account?: Record<string, unknown> },
  ): string {
    const line = JSON.parse(TEMPLATES.AUTH_STATUS);
    line.status = status;
    if (opts?.output !== undefined) line.output = opts.output;
    if (opts?.account !== undefined) line.account = opts.account;
    line.uuid = `fake-auth-status-${++_seq}`;
    return JSON.stringify(line);
  },

  rawUnknown(type: string, extra: Record<string, unknown> = {}): string {
    const line = JSON.parse(TEMPLATES.UNKNOWN_EVENT);
    line.type = type;
    Object.assign(line, extra);
    line.uuid = `fake-unknown-${++_seq}`;
    return JSON.stringify(line);
  },

  speechToTextMessage(channelId: string, text: string, done = false): string {
    const line = JSON.parse(TEMPLATES.SPEECH_TO_TEXT_MESSAGE);
    line.channelId = channelId;
    line.text = text;
    line.done = done;
    line.uuid = `fake-stt-${++_seq}`;
    return JSON.stringify(line);
  },

  controlRequestOpenInEditor(requestId: string, sessionId?: string): string {
    const line = JSON.parse(TEMPLATES.CONTROL_REQUEST_OPEN_IN_EDITOR);
    line.request_id = requestId;
    if (sessionId !== undefined) line.request.sessionId = sessionId;
    line.request.tool_use_id = `toolu_fake_${++_seq}`;
    return JSON.stringify(line);
  },

  /** control_request for show_notification — synthetic fixture */
  controlRequestShowNotification(
    requestId: string,
    input: {
      message: string;
      severity?: 'error' | 'warning' | 'info';
      buttons?: string[];
      onlyIfNotVisible?: boolean;
    },
  ): string {
    const line = JSON.parse(TEMPLATES.CONTROL_REQUEST_SHOW_NOTIFICATION);
    line.request_id = requestId;
    line.request.input = { severity: 'info', buttons: [], onlyIfNotVisible: false, ...input };
    line.request.tool_use_id = `toolu_fake_${++_seq}`;
    return JSON.stringify(line);
  },

  notification(message: string): string {
    const line = JSON.parse(TEMPLATES.NOTIFICATION);
    line.message = message;
    line.timestamp = Date.now();
    line.uuid = `fake-notification-${++_seq}`;
    return JSON.stringify(line);
  },

  newSessionNotification(): string {
    const line = JSON.parse(TEMPLATES.NEW_SESSION_NOTIFICATION);
    line.uuid = `fake-new-session-${++_seq}`;
    return JSON.stringify(line);
  },

  experimentGates(gates: Record<string, boolean | string>): string {
    const line = JSON.parse(TEMPLATES.EXPERIMENT_GATES);
    line.gates = gates;
    line.uuid = `fake-experiment-gates-${++_seq}`;
    return JSON.stringify(line);
  },

  agent(
    id: string,
    description: string,
    opts?: {
      subagentType?: string;
      prompt?: string;
      runInBackground?: boolean;
      parentToolUseId?: string;
    },
  ): string {
    const line = JSON.parse(TEMPLATES.AGENT_TOOL);
    line.message.content[0].id = id;
    line.message.content[0].input = {
      description,
      ...(opts?.subagentType && { subagent_type: opts.subagentType }),
      ...(opts?.prompt && { prompt: opts.prompt }),
      ...(opts?.runInBackground !== undefined && { run_in_background: opts.runInBackground }),
    };
    line.message.id = `msg_fake_${++_seq}`;
    line.uuid = `fake-agent-${_seq}`;
    if (opts?.parentToolUseId) line.parent_tool_use_id = opts.parentToolUseId;
    return JSON.stringify(line);
  },

  toolUse(id: string, name: string, input: Record<string, unknown>): string {
    const line = JSON.parse(TEMPLATES.TOOL_USE);
    line.id = id;
    line.name = name;
    line.input = input;
    line.uuid = `fake-tool-use-${++_seq}`;
    return JSON.stringify(line);
  },
};
