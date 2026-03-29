/* biome-ignore-all lint/suspicious/noExplicitAny: test harness uses type assertions */

import {
  type FakeProcessHandle,
  FakeProcessProvider,
  segments as s,
} from '@code-quest/summoner/test';
import type { Container } from 'inversify';
import { io } from 'socket.io-client';
import { createTestContainer } from './create-test-container.ts';

let _seq = 0;

const DEFAULT_SESSION_ID = () => `fake-session-${++_seq}`;

export interface InitializeOptions {
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
  readonly socket: ReturnType<typeof io>;
  readonly container: Container;

  private _initSegments: string[] | null = null;
  private _lastInitRequestId: string | null = null;
  private _connectionHandler: ((serverSocket: unknown) => void) | null = null;
  private _controlRequestHandler:
    | ((request: Record<string, unknown>) => Record<string, unknown> | null)
    | null = null;

  /** Register a custom handler for control_request subtypes. Return response payload or null for default. */
  onControlRequest(
    handler: (request: Record<string, unknown>) => Record<string, unknown> | null,
  ): void {
    this._controlRequestHandler = handler;
  }

  constructor() {
    this.provider = new FakeProcessProvider();
    this.socket = io();

    const origSpawn = this.provider.spawn.bind(this.provider);
    this.provider.spawn = (cmd, args, options) => {
      const handle = origSpawn(cmd, args, options);
      this._wireAutoRespond(handle);
      return handle;
    };

    const serverSocket = (
      this.socket as unknown as { serverSocket: { emit: (...a: unknown[]) => unknown } }
    ).serverSocket;

    this.container = createTestContainer({ processProvider: this.provider });
    const chatHandler = this.container.get(Symbol.for('ChatHandler')) as {
      register: (io: unknown) => void;
    };

    chatHandler.register({
      on: (event: string, cb: (...args: unknown[]) => void) => {
        if (event === 'connection') {
          this._connectionHandler = cb;
          cb(serverSocket);
        }
      },
      emit(event: string, ...args: unknown[]) {
        serverSocket.emit(event, ...args);
      },
    });
  }

  /** Create a second socket connected to the same server (multi-browser scenario) */
  connect(): ReturnType<typeof io> {
    const socket2 = io();
    const serverSocket2 = (socket2 as any).serverSocket;
    this._connectionHandler?.(serverSocket2);
    return socket2;
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
    const channelId = await new Promise<string>((resolve) => {
      (
        this.socket as unknown as {
          emit: (e: string, p: unknown, cb: (r: { channelId: string }) => void) => void;
        }
      ).emit('session:launch', launchPayload, (res) => resolve(res.channelId));
    });

    // Wait for async pipeline
    await new Promise<void>((r) => queueMicrotask(r));
    await new Promise<void>((r) => queueMicrotask(r));

    // Emit additional startup segments
    for (const seg of extraSegments) {
      await this.emit(seg);
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
        const requestId = (parsed.request_id as string) ?? (request?.request_id as string);

        if (request?.subtype === 'initialize') {
          // Always record requestId for emit(callback) usage
          this._lastInitRequestId = requestId;

          if (!this._initSegments) return; // no auto-respond — test sends manually

          h.emit(this._initSegments[0]);

          if (this._initSegments[1]) {
            const respLine = JSON.parse(this._initSegments[1]);
            if (respLine.response) respLine.response.request_id = requestId;
            h.emit(JSON.stringify(respLine));
          } else {
            const initData = JSON.parse(this._initSegments[0]);
            const slashCmds = initData.slash_commands as string[] | undefined;
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

  async emit(segment: string): Promise<{ requestId: string | null }> {
    this.provider.latest.emit(segment);
    await new Promise<void>((r) => queueMicrotask(r));
    await new Promise<void>((r) => queueMicrotask(r));
    return { requestId: this._lastInitRequestId };
  }

  /** Send socket event to server, await handler completion, return callback result */
  async send<T = void>(event: string, payload?: unknown): Promise<T> {
    const sock = this.socket as any;
    let callbackResult: T | undefined;
    const cb = (result: T) => {
      callbackResult = result;
    };
    if (payload !== undefined) {
      sock.emit(event, payload, cb);
    } else {
      sock.emit(event, cb);
    }
    // Await async handler completion
    const handlerPromise = sock.serverSocket?.lastHandlerPromise;
    if (handlerPromise) await handlerPromise;
    return callbackResult as T;
  }

  received(): Record<string, unknown>[];
  received(type: string): Record<string, unknown>[];
  received(type?: string): Record<string, unknown>[] {
    return type ? this.provider.latest.received(type) : this.provider.latest.received();
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
}

export function createFakeClaude(): FakeClaude {
  return new FakeClaude();
}
