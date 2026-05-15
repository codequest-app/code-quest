/* biome-ignore-all lint/suspicious/noExplicitAny: test harness uses type assertions */

import type { ServerToClientEvents, SessionBroadcastState } from '@code-quest/schemas';
import type {
  FakeProcessHandle,
  FakeProcessProvider,
  ReceivedMessageMap,
} from './fake-process-provider.ts';
import type { FakeSocket } from './fake-socket.ts';
import { segments as s } from './segments-node.ts';

/** Extract the payload type for a given server-to-client event. */
type PayloadOf<E extends keyof ServerToClientEvents> = Parameters<ServerToClientEvents[E]>[0];

export interface FakeClaudeOptions {
  socket: FakeSocket;
  provider: FakeProcessProvider;
}

let _seq = 0;

const DEFAULT_SESSION_ID = () => `fake-session-${++_seq}`;

interface InitializeOptions {
  /** Launch options forwarded to session:launch (channelId, thinkingLevel, cwd, etc.) */
  launch?: Record<string, unknown>;
}

/**
 * FakeClaude — unified test harness for client + server.
 *
 * Two verification paths:
 * - Down (Claude → Client): `await claude.emit(segment)` → socket event → UI or assertions
 * - Up (Client → Claude): socket.emit / user action → `claude.received()` verifies stdin
 */
export class FakeClaude {
  readonly provider: FakeProcessProvider;
  private readonly _socket: FakeSocket;

  private _initSegments: string[] | null = null;
  private _lastInitRequestId: string | null = null;
  private readonly _recordedEvents: Array<{ event: string; payload: any }> = [];
  private _controlRequestHandler:
    | ((request: Record<string, unknown>) => Record<string, unknown> | null)
    | null = null;

  /** Replace the default control_request auto-responder. Return response payload or null for default. */
  setControlRequestHandler(
    handler: (request: Record<string, unknown>) => Record<string, unknown> | null,
  ): void {
    this._controlRequestHandler = handler;
  }

  constructor(options: FakeClaudeOptions) {
    this.provider = options.provider;
    this._socket = options.socket;

    const origSpawn = this.provider.spawn.bind(this.provider);
    this.provider.spawn = (cmd, args, opts) => {
      const handle = origSpawn(cmd, args, opts);
      this._wireAutoRespond(handle);
      return handle;
    };

    // Record all server → client events
    const { serverSocket } = this._socket;
    const origServerEmit = serverSocket.emit.bind(serverSocket);
    serverSocket.emit = (event: string, ...args: unknown[]) => {
      this._recordedEvents.push({ event, payload: args[0] });
      return origServerEmit(event, ...args);
    };
  }

  /**
   * Initialize a session — models the full CLI startup sequence.
   *
   * Usage:
   *   await claude.initialize();                                             // default
   *   await claude.initialize(s.init('s', { model: 'haiku' }));              // custom init
   *   await claude.initialize(initSeg, responseSeg, s.experimentGates({}));  // + extra
   *   await claude.initialize({ launch: { thinkingLevel: 'default_on' } }, initSeg); // launch opts
   */
  async initialize(...args: Array<string | InitializeOptions>): Promise<string> {
    // Extract options object if first arg is not a string
    let opts: InitializeOptions = {};
    const segments: string[] = [];
    for (const arg of args) {
      if (typeof arg === 'string') {
        segments.push(arg);
      } else if (arg != null) {
        opts = arg;
      }
    }

    const initSegment = segments[0] ?? s.init(DEFAULT_SESSION_ID());
    const responseSegment = segments[1];
    const extraSegments = segments.slice(2);

    // Configure onSend hook
    this._initSegments = [initSegment, ...(responseSegment ? [responseSegment] : [])];

    // Trigger server flow
    const launchPayload = {
      channelId: crypto.randomUUID(),
      ...opts.launch,
    };
    const channelId = await new Promise<string>((resolve, reject) => {
      this._socket.emit(
        'session:launch',
        launchPayload,
        (res: { ok: true; data: { channelId: string } } | { ok: false; error: string }) => {
          if (!res.ok) {
            reject(new Error(res.error));
            return;
          }
          resolve(res.data.channelId);
        },
      );
    });

    // Wait for async pipeline
    await new Promise<void>((r) => queueMicrotask(r));
    await new Promise<void>((r) => queueMicrotask(r));

    // Emit additional startup segments
    for (const seg of extraSegments) {
      await this.emitSegment(seg);
    }

    return channelId;
  }

  private _wireAutoRespond(handle: FakeProcessHandle): void {
    handle.onSend = (raw: string, h: FakeProcessHandle) => {
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return;
      }

      if (parsed.type === 'control_request') {
        const request = parsed.request as Record<string, unknown> | undefined;
        const requestId = String(parsed.request_id ?? request?.request_id ?? '');

        if (request?.subtype === 'initialize') {
          // Always record requestId for emit(callback) usage
          this._lastInitRequestId = requestId;

          if (!this._initSegments) return; // no auto-respond — test sends manually

          // Inject spawn cwd into init segment so channel.cwd matches spawn's cwd
          const lastSpawn = this.provider.spawnCalls[this.provider.spawnCalls.length - 1];
          const spawnCwd =
            typeof lastSpawn?.options?.cwd === 'string' ? lastSpawn.options.cwd : undefined;
          let initLine = this._initSegments[0]!;
          if (spawnCwd) {
            const initObj = JSON.parse(initLine);
            initObj.cwd = spawnCwd;
            initLine = JSON.stringify(initObj);
          }
          h.emit(initLine);

          if (this._initSegments[1]) {
            const respLine = JSON.parse(this._initSegments[1]!);
            if (respLine.response) respLine.response.request_id = requestId;
            h.emit(JSON.stringify(respLine));
          } else {
            const initData = JSON.parse(this._initSegments[0]!);
            const slashCmds = Array.isArray(initData.slash_commands)
              ? (initData.slash_commands as string[])
              : undefined;
            const response: Record<string, unknown> = {
              subtype: 'success',
              request_id: requestId,
            };
            const initResp: Record<string, unknown> = {};
            if (slashCmds) {
              initResp.commands = slashCmds.map((name: string) => ({ name }));
            }
            if (Object.keys(initResp).length > 0) {
              response.response = initResp;
            }
            h.emit(JSON.stringify({ type: 'control_response', response }));
          }
          return;
        }

        // Check custom handler first
        if (this._controlRequestHandler) {
          const customResponse = this._controlRequestHandler(request ?? {});
          if (customResponse) {
            h.emit(
              JSON.stringify({
                type: 'control_response',
                response: { subtype: 'success', request_id: requestId, response: customResponse },
              }),
            );
            return;
          }
        }

        h.emit(
          JSON.stringify({
            type: 'control_response',
            response: { subtype: 'success', request_id: requestId },
          }),
        );
      }
    };
  }

  async emitSegment(segment: string): Promise<{ requestId: string | null }> {
    this.provider.latest.emit(segment);
    await new Promise<void>((r) => queueMicrotask(r));
    await new Promise<void>((r) => queueMicrotask(r));
    return { requestId: this._lastInitRequestId };
  }

  /** Send socket event to server, await handler completion, return callback result */
  async send<T = void>(event: string, payload?: unknown): Promise<T> {
    let callbackResult: T | undefined;
    const cb = (result: T) => {
      callbackResult = result;
    };
    if (payload !== undefined) {
      this._socket.emit(event, payload, cb);
    } else {
      this._socket.emit(event, cb);
    }
    // Await async handler completion
    const handlerPromise = this._socket.serverSocket.lastHandlerPromise;
    if (handlerPromise) await handlerPromise;
    return callbackResult as T;
  }

  received(): Array<Record<string, unknown>>;
  received<T extends keyof ReceivedMessageMap>(type: T): Array<ReceivedMessageMap[T]>;
  received(type: string): Array<Record<string, unknown>>;
  received(type?: string): Array<Record<string, unknown>> {
    return type
      ? this.provider.latest.received(type as keyof ReceivedMessageMap)
      : this.provider.latest.received();
  }

  /** Query recorded server → client events. All events are auto-recorded. */
  receivedEvents(): Array<{ event: string; payload: unknown }>;
  receivedEvents<E extends keyof ServerToClientEvents>(eventName: E): Array<PayloadOf<E>>;
  receivedEvents(eventName: string): unknown[];
  receivedEvents(eventName?: string): unknown {
    if (!eventName) return this._recordedEvents;
    return this._recordedEvents.filter((e) => e.event === eventName).map((e) => e.payload);
  }

  get hasInitSegments(): boolean {
    return this._initSegments !== null;
  }

  /** Set init response segments for auto-respond without triggering session:launch. */
  prepareInit(...segments: string[]): void {
    const initSegment = segments[0] ?? s.init(DEFAULT_SESSION_ID());
    this._initSegments = [initSegment, ...segments.slice(1)];
  }

  get handle(): FakeProcessHandle {
    return this.provider.latest;
  }

  /** The request_id of the most recent session:initialize control_request sent by the server. */
  get lastInitRequestId(): string | null {
    return this._lastInitRequestId;
  }

  /** Subscribe to server-pushed socket events (for callbacks that need timing/filtering). */
  on(event: string, fn: (...args: any[]) => void): void {
    this._socket.on(event, fn);
  }

  /** Simulate server pushing a socket event to client. */
  pushServerEvent(event: string, payload: Record<string, unknown>): void {
    this._socket.serverSocket.emit(event, payload);
  }

  /** Simulate server broadcasting session:states for one channel. */
  pushSessionState(
    channelId: string,
    state: SessionBroadcastState,
    opts: { projectRoot?: string; cwd?: string } = {},
  ): void {
    const { projectRoot = '/test/cwd', cwd } = opts;
    this.pushServerEvent('session:states', {
      sessions: [{ channelId, state, projectRoot, ...(cwd ? { cwd } : {}) }],
    });
  }

  /** Simulate server broadcasting session:closed for one channel. */
  pushSessionClosed(channelId: string, error?: string): void {
    this.pushServerEvent('session:closed', {
      channelId,
      ...(error ? { error } : {}),
    });
  }

  connect(): void {
    this._socket.connect();
  }

  disconnect(): void {
    this._socket.disconnect();
  }

  get connected(): boolean {
    return this._socket.connected;
  }

  listeners(event: string): ((...args: any[]) => void)[] {
    return this._socket.listeners(event) as ((...args: any[]) => void)[];
  }
}
