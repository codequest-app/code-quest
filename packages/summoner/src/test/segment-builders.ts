// ── Segment builder core ──
// Pure logic — no Node.js or file-system dependencies.
// Accepts pre-loaded template strings; returns builders + resetSeq.

export interface SegmentTemplates {
  INIT: string;
  ASSISTANT_TEXT: string;
  ASSISTANT_TOOL: string;
  THINKING: string;
  CONTROL_REQUEST?: string;
  CONTROL_REQUEST_BASH?: string;
  CONTROL_REQUEST_ASK_USER_QUESTION?: string;
  CONTROL_REQUEST_EXIT_PLAN_MODE?: string;
  CONTROL_RESPONSE: string;
  CONTROL_RESPONSE_ERROR: string;
  CONTROL_CANCEL_REQUEST: string;
  TOOL_RESULT: string;
  USER_TEXT?: string;
  RESULT_SUCCESS: string;
  RESULT_ERROR: string;
  RESULT_RESUME_NOT_FOUND: string;
  STATUS: string;
  TASK_STARTED: string;
  STREAM_TEXT_DELTA?: string;
  STREAM_INPUT_JSON_DELTA?: string;
  STREAM_THINKING_DELTA?: string;
  STREAM_SIGNATURE_DELTA?: string;
  STREAM_CONTENT_BLOCK_START?: string;
  STREAM_CONTENT_BLOCK_STOP?: string;
  STREAM_MESSAGE_START?: string;
  STREAM_MESSAGE_DELTA?: string;
  STREAM_MESSAGE_STOP?: string;
  RATE_LIMIT_EVENT?: string;
  HOOK_STARTED?: string;
  HOOK_RESPONSE?: string;
  TOOL_USE?: string;
  AGENT_TOOL: string;
  CONTROL_REQUEST_OPEN_DIFF?: string;
  CONTROL_REQUEST_OPEN_IN_EDITOR?: string;
  SPEECH_TO_TEXT_MESSAGE?: string;
  NOTIFICATION?: string;
  NEW_SESSION_NOTIFICATION?: string;
  CONTROL_REQUEST_ELICITATION?: string;
  CONTROL_REQUEST_SHOW_NOTIFICATION?: string;
  STREAMLINED_TEXT?: string;
  STREAMLINED_TOOL_USE_SUMMARY?: string;
  CITATIONS_DELTA?: string;
  THINKING_DELTA_LEGACY?: string;
  TASK_NOTIFICATION?: string;
  TASK_PROGRESS?: string;
  CLI_ERROR?: string;
  BRIDGE_STATE?: string;
  COMPACT_BOUNDARY?: string;
  EXPERIMENT_GATES?: string;
  AUTH_STATUS?: string;
  AUTH_URL?: string;
  UNKNOWN_EVENT?: string;
  SYSTEM_MIRROR_ERROR?: string;
  CONTROL_SEED_READ_STATE?: string;
  CONTROL_CHANNEL_ENABLE?: string;
  [key: string]: string | undefined;
}

export type SegmentBuilders = ReturnType<typeof buildSegments>;

function buildStreamDelta(
  template: string | undefined,
  deltaKey: string,
  value: unknown,
  uuidPrefix: string,
  seq: number,
  opts?: { index?: number; parentToolUseId?: string },
): string {
  const line = JSON.parse(template ?? '{}') as Record<string, unknown>;
  const event = line.event as Record<string, unknown>;
  (event.delta as Record<string, unknown>)[deltaKey] = value;
  if (opts?.index != null) event.index = opts.index;
  if (opts?.parentToolUseId) line.parent_tool_use_id = opts.parentToolUseId;
  line.uuid = `fake-${uuidPrefix}-delta-${seq}`;
  return JSON.stringify(line);
}

export function createSegments(T: SegmentTemplates): {
  segments: SegmentBuilders;
  resetSeq: () => void;
} {
  const ref = { seq: 0 };
  const resetSeq = (): void => {
    ref.seq = 0;
  };
  const segments = buildSegments(T, ref);
  return { segments, resetSeq };
}

function buildSegments(T: SegmentTemplates, ref: { seq: number }) {
  const next = (): number => ++ref.seq;
  const getSeq = (): number => ref.seq;

  return {
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
      const line = JSON.parse(T.INIT) as Record<string, unknown>;
      line.session_id = sessionId;
      line.uuid = `fake-init-${next()}`;
      if (opts?.model) line.model = opts.model;
      if (opts?.tools) line.tools = opts.tools;
      if (opts?.permissionMode) line.permissionMode = opts.permissionMode;
      if (opts?.fastModeState !== undefined) line.fast_mode_state = opts.fastModeState;
      if (opts?.mcpServers) line.mcp_servers = opts.mcpServers;
      if (opts?.slashCommands) line.slash_commands = opts.slashCommands;
      if (opts?.currentRepo)
        line.current_repo = {
          branch: opts.currentRepo.branch,
          is_clean: opts.currentRepo.isClean,
        };
      return JSON.stringify(line);
    },

    user(text: string, opts?: { uuid?: string }): string {
      const line = JSON.parse(T.USER_TEXT ?? '{}') as Record<string, unknown>;
      const content = (line.message as Record<string, unknown>).content as Record<
        string,
        unknown
      >[];
      if (content[0]) content[0].text = text;
      line.uuid = opts?.uuid ?? `fake-user-${next()}`;
      return JSON.stringify(line);
    },

    assistant(
      textOrOpts: string | { toolUse: { id: string; name: string; input: unknown } },
      opts?: { parentToolUseId?: string },
    ): string {
      if (typeof textOrOpts === 'string') {
        const line = JSON.parse(T.ASSISTANT_TEXT) as Record<string, unknown>;
        const msg = line.message as Record<string, unknown>;
        const block = (msg.content as Record<string, unknown>[])[0];
        if (block) block.text = textOrOpts;
        msg.id = `msg_fake_${next()}`;
        line.uuid = `fake-asst-${getSeq()}`;
        if (opts?.parentToolUseId) line.parent_tool_use_id = opts.parentToolUseId;
        return JSON.stringify(line);
      }

      const { id, name, input } = textOrOpts.toolUse;
      const line = JSON.parse(T.ASSISTANT_TOOL) as Record<string, unknown>;
      const msg = line.message as Record<string, unknown>;
      const content = (msg.content as Record<string, unknown>[])[0];
      if (content) {
        content.id = id;
        content.name = name;
        content.input = input;
      }
      msg.id = `msg_fake_${next()}`;
      line.uuid = `fake-asst-${getSeq()}`;
      if (opts?.parentToolUseId) line.parent_tool_use_id = opts.parentToolUseId;
      return JSON.stringify(line);
    },

    thinking(text: string, opts?: { parentToolUseId?: string }): string {
      const line = JSON.parse(T.THINKING) as Record<string, unknown>;
      const msg = line.message as Record<string, unknown>;
      const block = (msg.content as Record<string, unknown>[])[0];
      if (block) block.thinking = text;
      msg.id = `msg_fake_${next()}`;
      line.uuid = `fake-asst-${getSeq()}`;
      if (opts?.parentToolUseId) line.parent_tool_use_id = opts.parentToolUseId;
      return JSON.stringify(line);
    },

    controlRequest(requestId: string, subtype: string, toolName?: string, input?: unknown): string {
      const line = JSON.parse(T.CONTROL_REQUEST ?? '{}') as Record<string, unknown>;
      line.request_id = requestId;
      const req = line.request as Record<string, unknown>;
      req.subtype = subtype;
      if (toolName !== undefined) req.tool_name = toolName;
      if (input !== undefined) req.input = input;
      req.tool_use_id = `toolu_fake_${next()}`;
      return JSON.stringify(line);
    },

    controlRequestBash(
      requestId: string,
      input: { command: string; description?: string },
    ): string {
      const line = JSON.parse(T.CONTROL_REQUEST_BASH ?? '{}') as Record<string, unknown>;
      line.request_id = requestId;
      const req = line.request as Record<string, unknown>;
      req.input = input;
      req.tool_use_id = `toolu_fake_${next()}`;
      return JSON.stringify(line);
    },

    controlRequestAskUserQuestion(requestId: string, input: { questions: unknown[] }): string {
      const line = JSON.parse(T.CONTROL_REQUEST_ASK_USER_QUESTION ?? '{}') as Record<
        string,
        unknown
      >;
      line.request_id = requestId;
      const req = line.request as Record<string, unknown>;
      req.input = input;
      req.tool_use_id = `toolu_fake_${next()}`;
      return JSON.stringify(line);
    },

    controlRequestExitPlanMode(requestId: string, input?: Record<string, unknown>): string {
      const line = JSON.parse(T.CONTROL_REQUEST_EXIT_PLAN_MODE ?? '{}') as Record<string, unknown>;
      line.request_id = requestId;
      const req = line.request as Record<string, unknown>;
      if (input !== undefined) req.input = input;
      req.tool_use_id = `toolu_fake_${next()}`;
      return JSON.stringify(line);
    },

    controlRequestOpenDiff(
      requestId: string,
      input: {
        originalFilePath: string;
        newFilePath: string;
        edits?: unknown[];
        supportMultiEdits?: boolean;
      },
    ): string {
      const line = JSON.parse(T.CONTROL_REQUEST_OPEN_DIFF ?? '{}') as Record<string, unknown>;
      line.request_id = requestId;
      const req = line.request as Record<string, unknown>;
      req.input = { supportMultiEdits: false, edits: [], ...input };
      req.tool_use_id = `toolu_fake_${next()}`;
      return JSON.stringify(line);
    },

    controlRequestElicitation(
      requestId: string,
      input: {
        message: string;
        requestedSchema?: Record<string, unknown>;
        mode?: 'text' | 'url' | 'form';
        url?: string;
      },
    ): string {
      const line = JSON.parse(T.CONTROL_REQUEST_ELICITATION ?? '{}') as Record<string, unknown>;
      line.request_id = requestId;
      const req = line.request as Record<string, unknown>;
      const { requestedSchema, ...rest } = input;
      req.input =
        requestedSchema !== undefined ? { ...rest, requested_schema: requestedSchema } : rest;
      req.tool_use_id = `toolu_fake_${next()}`;
      return JSON.stringify(line);
    },

    toolResult(toolUseId: string, content: string, opts?: { parentToolUseId?: string }): string {
      const line = JSON.parse(T.TOOL_RESULT) as Record<string, unknown>;
      const msg = line.message as Record<string, unknown>;
      const item = (msg.content as Record<string, unknown>[])[0];
      if (item) {
        item.tool_use_id = toolUseId;
        item.content = content;
        delete item.is_error;
      }
      line.uuid = `fake-tr-${next()}`;
      if (opts?.parentToolUseId) line.parent_tool_use_id = opts.parentToolUseId;
      return JSON.stringify(line);
    },

    controlResponse(requestId: string, response?: Record<string, unknown>): string {
      const line = JSON.parse(T.CONTROL_RESPONSE) as Record<string, unknown>;
      const resp = line.response as Record<string, unknown>;
      resp.request_id = requestId;
      if (response !== undefined) resp.response = response;
      return JSON.stringify(line);
    },

    controlResponseError(requestId: string, error: string): string {
      const line = JSON.parse(T.CONTROL_RESPONSE_ERROR) as Record<string, unknown>;
      const resp = line.response as Record<string, unknown>;
      resp.request_id = requestId;
      resp.error = error;
      return JSON.stringify(line);
    },

    controlCancelRequest(requestId: string): string {
      const line = JSON.parse(T.CONTROL_CANCEL_REQUEST) as Record<string, unknown>;
      Object.assign(line, { request_id: requestId });
      return JSON.stringify(line);
    },

    status(opts: { status?: string | null; permissionMode?: string }): string {
      const line = JSON.parse(T.STATUS) as Record<string, unknown>;
      line.status = opts.status ?? null;
      if (opts.permissionMode !== undefined) line.permissionMode = opts.permissionMode;
      line.uuid = `fake-status-${next()}`;
      return JSON.stringify(line);
    },

    taskStarted(toolUseId: string, description: string): string {
      const line = JSON.parse(T.TASK_STARTED) as Record<string, unknown>;
      line.tool_use_id = toolUseId;
      line.description = description;
      line.task_id = `fake-task-${next()}`;
      line.uuid = `fake-task-started-${getSeq()}`;
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
      const line = JSON.parse(T.TASK_NOTIFICATION ?? '{}') as Record<string, unknown>;
      line.task_id = taskId;
      if (opts?.toolUseId) line.tool_use_id = opts.toolUseId;
      if (opts?.status) line.status = opts.status;
      if (opts?.outputFile) line.output_file = opts.outputFile;
      if (opts?.summary) line.summary = opts.summary;
      if (opts?.usage) line.usage = opts.usage;
      line.uuid = `fake-task-notif-${next()}`;
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
      const line = JSON.parse(T.TASK_PROGRESS ?? '{}') as Record<string, unknown>;
      line.task_id = taskId;
      if (opts?.toolUseId) line.tool_use_id = opts.toolUseId;
      if (opts?.description) line.description = opts.description;
      if (opts?.lastToolName) line.last_tool_name = opts.lastToolName;
      if (opts?.usage) line.usage = opts.usage;
      line.uuid = `fake-task-progress-${next()}`;
      return JSON.stringify(line);
    },

    resultError(opts?: {
      durationMs?: number;
      costUsd?: number;
      errors?: string[];
      terminalReason?: string;
    }): string {
      const template = opts?.errors ? T.RESULT_RESUME_NOT_FOUND : T.RESULT_ERROR;
      const line = JSON.parse(template) as Record<string, unknown>;
      if (opts?.durationMs != null) {
        line.duration_ms = opts.durationMs;
        line.duration_api_ms = opts.durationMs;
      }
      if (opts?.costUsd != null) line.total_cost_usd = opts.costUsd;
      if (opts?.errors != null) line.errors = opts.errors;
      if (opts?.terminalReason != null) line.terminal_reason = opts.terminalReason;
      line.uuid = `fake-result-err-${next()}`;
      return JSON.stringify(line);
    },

    textDelta(text: string, opts?: { index?: number; parentToolUseId?: string }): string {
      return buildStreamDelta(T.STREAM_TEXT_DELTA, 'text', text, 'text', next(), opts);
    },

    inputJsonDelta(
      partialJson: string,
      opts?: { index?: number; parentToolUseId?: string },
    ): string {
      return buildStreamDelta(
        T.STREAM_INPUT_JSON_DELTA,
        'partial_json',
        partialJson,
        'input-json',
        next(),
        opts,
      );
    },

    thinkingDelta(thinking: string, opts?: { index?: number; parentToolUseId?: string }): string {
      return buildStreamDelta(
        T.STREAM_THINKING_DELTA,
        'thinking',
        thinking,
        'thinking',
        next(),
        opts,
      );
    },

    signatureDelta(signature: string, opts?: { index?: number; parentToolUseId?: string }): string {
      return buildStreamDelta(
        T.STREAM_SIGNATURE_DELTA,
        'signature',
        signature,
        'sig',
        next(),
        opts,
      );
    },

    contentBlockStart(
      index?: number,
      blockType?: string,
      opts?: { parentToolUseId?: string },
    ): string {
      const line = JSON.parse(T.STREAM_CONTENT_BLOCK_START ?? '{}') as Record<string, unknown>;
      const event = line.event as Record<string, unknown>;
      if (index !== undefined) event.index = index;
      if (blockType !== undefined) event.content_block = { type: blockType };
      if (opts?.parentToolUseId) line.parent_tool_use_id = opts.parentToolUseId;
      line.uuid = `fake-block-start-${next()}`;
      return JSON.stringify(line);
    },

    contentBlockStop(index: number, opts?: { parentToolUseId?: string }): string {
      const line = JSON.parse(T.STREAM_CONTENT_BLOCK_STOP ?? '{}') as Record<string, unknown>;
      (line.event as Record<string, unknown>).index = index;
      if (opts?.parentToolUseId) line.parent_tool_use_id = opts.parentToolUseId;
      line.uuid = `fake-block-stop-${next()}`;
      return JSON.stringify(line);
    },

    messageStart(opts?: { model?: string; parentToolUseId?: string }): string {
      const line = JSON.parse(T.STREAM_MESSAGE_START ?? '{}') as Record<string, unknown>;
      const event = line.event as Record<string, unknown>;
      if (opts?.model) (event.message as Record<string, unknown>).model = opts.model;
      if (opts?.parentToolUseId) line.parent_tool_use_id = opts.parentToolUseId;
      line.uuid = `fake-msg-start-${next()}`;
      return JSON.stringify(line);
    },

    messageDelta(opts?: { stopReason?: string; parentToolUseId?: string }): string {
      const line = JSON.parse(T.STREAM_MESSAGE_DELTA ?? '{}') as Record<string, unknown>;
      const event = line.event as Record<string, unknown>;
      if (opts?.stopReason) (event.delta as Record<string, unknown>).stop_reason = opts.stopReason;
      if (opts?.parentToolUseId) line.parent_tool_use_id = opts.parentToolUseId;
      line.uuid = `fake-msg-delta-${next()}`;
      return JSON.stringify(line);
    },

    messageStop(opts?: { parentToolUseId?: string }): string {
      const line = JSON.parse(T.STREAM_MESSAGE_STOP ?? '{}') as Record<string, unknown>;
      if (opts?.parentToolUseId) line.parent_tool_use_id = opts.parentToolUseId;
      line.uuid = `fake-msg-stop-${next()}`;
      return JSON.stringify(line);
    },

    streamlinedText(text: string): string {
      const line = JSON.parse(T.STREAMLINED_TEXT ?? '{}') as Record<string, unknown>;
      line.text = text;
      return JSON.stringify(line);
    },

    streamlinedToolUseSummary(toolSummary: string): string {
      const line = JSON.parse(T.STREAMLINED_TOOL_USE_SUMMARY ?? '{}') as Record<string, unknown>;
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
      const line = JSON.parse(T.RATE_LIMIT_EVENT ?? '{}') as Record<string, unknown>;
      const info = line.rate_limit_info as Record<string, unknown>;
      if (opts?.status) info.status = opts.status;
      if (opts?.rateLimitType) info.rateLimitType = opts.rateLimitType;
      if (opts?.resetsAt !== undefined) info.resetsAt = opts.resetsAt;
      if (opts?.overageStatus !== undefined) info.overageStatus = opts.overageStatus;
      if (opts?.isUsingOverage !== undefined) info.isUsingOverage = opts.isUsingOverage;
      line.uuid = `fake-rate-limit-${next()}`;
      return JSON.stringify(line);
    },

    hookStarted(hookId?: string, hookName?: string, hookEvent?: string): string {
      const line = JSON.parse(T.HOOK_STARTED ?? '{}') as Record<string, unknown>;
      if (hookId !== undefined) line.hook_id = hookId;
      if (hookName !== undefined) line.hook_name = hookName;
      if (hookEvent !== undefined) line.hook_event = hookEvent;
      line.uuid = `fake-hook-started-${next()}`;
      return JSON.stringify(line);
    },

    hookResponse(hookId: string, hookName: string, hookEvent: string, output?: string): string {
      const line = JSON.parse(T.HOOK_RESPONSE ?? '{}') as Record<string, unknown>;
      line.hook_id = hookId;
      line.hook_name = hookName;
      line.hook_event = hookEvent;
      if (output !== undefined) line.output = output;
      line.uuid = `fake-hook-response-${next()}`;
      return JSON.stringify(line);
    },

    citationsDelta(citation: Record<string, unknown>, opts?: { index?: number }): string {
      return buildStreamDelta(T.CITATIONS_DELTA, 'citation', citation, 'citations', next(), opts);
    },

    thinkingDeltaLegacy(thinking: string, opts?: { index?: number }): string {
      return buildStreamDelta(
        T.THINKING_DELTA_LEGACY,
        'thinking',
        thinking,
        'thinking-legacy',
        next(),
        opts,
      );
    },

    compactBoundary(opts?: { preservedSegment?: boolean }): string {
      const line = JSON.parse(T.COMPACT_BOUNDARY ?? '{}') as Record<string, unknown>;
      if (opts?.preservedSegment !== undefined) {
        line.compactMetadata = { preservedSegment: opts.preservedSegment };
      }
      return JSON.stringify(line);
    },

    bridgeState(state: 'ready' | 'disconnected' | 'error', detail?: string): string {
      const line = JSON.parse(T.BRIDGE_STATE ?? '{}') as Record<string, unknown>;
      line.state = state;
      if (detail !== undefined) line.detail = detail;
      line.uuid = `fake-bridge-state-${next()}`;
      return JSON.stringify(line);
    },

    mirrorError(error: string, sessionId: string): string {
      const line = JSON.parse(T.SYSTEM_MIRROR_ERROR ?? '{}') as Record<string, unknown>;
      line.error = error;
      line.session_id = sessionId;
      line.key = { sessionId };
      line.uuid = `fake-mirror-error-${next()}`;
      return JSON.stringify(line);
    },

    seedReadState(path: string, mtime: number): string {
      const line = JSON.parse(T.CONTROL_SEED_READ_STATE ?? '{}') as Record<string, unknown>;
      const req = line.request as Record<string, unknown>;
      req.path = path;
      req.mtime = mtime;
      line.request_id = `seed-read-${next()}`;
      return JSON.stringify(line);
    },

    channelEnable(serverName: string): string {
      const line = JSON.parse(T.CONTROL_CHANNEL_ENABLE ?? '{}') as Record<string, unknown>;
      (line.request as Record<string, unknown>).serverName = serverName;
      line.request_id = `channel-enable-${next()}`;
      return JSON.stringify(line);
    },

    error(message: string): string {
      const line = JSON.parse(T.CLI_ERROR ?? '{}') as Record<string, unknown>;
      (line.error as Record<string, unknown>).message = message;
      line.uuid = `fake-error-${next()}`;
      return JSON.stringify(line);
    },

    result(opts?: { durationMs?: number; costUsd?: number }): string {
      const line = JSON.parse(T.RESULT_SUCCESS) as Record<string, unknown>;
      if (opts?.durationMs != null) {
        line.duration_ms = opts.durationMs;
        line.duration_api_ms = opts.durationMs;
      }
      if (opts?.costUsd != null) line.total_cost_usd = opts.costUsd;
      line.uuid = `fake-result-${next()}`;
      return JSON.stringify(line);
    },

    authUrl(url: string, method: string): string {
      const line = JSON.parse(T.AUTH_URL ?? '{}') as Record<string, unknown>;
      line.url = url;
      line.method = method;
      line.uuid = `fake-auth-url-${next()}`;
      return JSON.stringify(line);
    },

    authStatus(
      status: string,
      opts?: { output?: string; account?: Record<string, unknown> },
    ): string {
      const line = JSON.parse(T.AUTH_STATUS ?? '{}') as Record<string, unknown>;
      line.status = status;
      if (opts?.output !== undefined) line.output = opts.output;
      if (opts?.account !== undefined) line.account = opts.account;
      line.uuid = `fake-auth-status-${next()}`;
      return JSON.stringify(line);
    },

    rawUnknown(type: string, extra: Record<string, unknown> = {}): string {
      const line = JSON.parse(T.UNKNOWN_EVENT ?? '{}') as Record<string, unknown>;
      line.type = type;
      Object.assign(line, extra);
      line.uuid = `fake-unknown-${next()}`;
      return JSON.stringify(line);
    },

    speechToTextMessage(channelId: string, text: string, done = false): string {
      const line = JSON.parse(T.SPEECH_TO_TEXT_MESSAGE ?? '{}') as Record<string, unknown>;
      line.channelId = channelId;
      line.text = text;
      line.done = done;
      line.uuid = `fake-stt-${next()}`;
      return JSON.stringify(line);
    },

    controlRequestOpenInEditor(requestId: string, sessionId?: string): string {
      const line = JSON.parse(T.CONTROL_REQUEST_OPEN_IN_EDITOR ?? '{}') as Record<string, unknown>;
      line.request_id = requestId;
      const req = line.request as Record<string, unknown>;
      if (sessionId !== undefined) req.sessionId = sessionId;
      req.tool_use_id = `toolu_fake_${next()}`;
      return JSON.stringify(line);
    },

    controlRequestShowNotification(
      requestId: string,
      input: {
        message: string;
        severity?: 'error' | 'warning' | 'info';
        buttons?: string[];
        onlyIfNotVisible?: boolean;
      },
    ): string {
      const line = JSON.parse(T.CONTROL_REQUEST_SHOW_NOTIFICATION ?? '{}') as Record<
        string,
        unknown
      >;
      line.request_id = requestId;
      const req = line.request as Record<string, unknown>;
      req.input = { severity: 'info', buttons: [], onlyIfNotVisible: false, ...input };
      req.tool_use_id = `toolu_fake_${next()}`;
      return JSON.stringify(line);
    },

    notification(message: string): string {
      const line = JSON.parse(T.NOTIFICATION ?? '{}') as Record<string, unknown>;
      line.message = message;
      line.timestamp = Date.now();
      line.uuid = `fake-notification-${next()}`;
      return JSON.stringify(line);
    },

    newSessionNotification(): string {
      const line = JSON.parse(T.NEW_SESSION_NOTIFICATION ?? '{}') as Record<string, unknown>;
      line.uuid = `fake-new-session-${next()}`;
      return JSON.stringify(line);
    },

    experimentGates(gates: Record<string, boolean | string>): string {
      const line = JSON.parse(T.EXPERIMENT_GATES ?? '{}') as Record<string, unknown>;
      line.gates = gates;
      line.uuid = `fake-experiment-gates-${next()}`;
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
      const line = JSON.parse(T.AGENT_TOOL) as Record<string, unknown>;
      const msg = line.message as Record<string, unknown>;
      const content = (msg.content as Record<string, unknown>[])[0];
      if (content) {
        content.id = id;
        content.input = {
          description,
          ...(opts?.subagentType && { subagent_type: opts.subagentType }),
          ...(opts?.prompt && { prompt: opts.prompt }),
          ...(opts?.runInBackground !== undefined && { run_in_background: opts.runInBackground }),
        };
      }
      msg.id = `msg_fake_${next()}`;
      line.uuid = `fake-agent-${getSeq()}`;
      if (opts?.parentToolUseId) line.parent_tool_use_id = opts.parentToolUseId;
      return JSON.stringify(line);
    },

    toolUse(id: string, name: string, input: Record<string, unknown>): string {
      const line = JSON.parse(T.TOOL_USE ?? '{}') as Record<string, unknown>;
      line.id = id;
      line.name = name;
      line.input = input;
      line.uuid = `fake-tool-use-${next()}`;
      return JSON.stringify(line);
    },
  };
}
