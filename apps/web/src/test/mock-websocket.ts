import type { Envelope } from '@code-quest/transport';

type Listener = (...args: unknown[]) => void;

/**
 * MockWebSocket — minimal stand-in for the browser's `WebSocket` global.
 * Used by `ws-client.test.ts` to drive WsClient through reconnect / outbox /
 * resume scenarios without a real network. Tests put it in place via
 * `globalThis.WebSocket = MockWebSocket as unknown as typeof globalThis.WebSocket`.
 *
 * Helpers (acceptOpen, deliverEnvelope, acceptClose) simulate server-side
 * events so the test author drives timing explicitly.
 */
export class MockWebSocket {
  static CONNECTING = 0 as const;
  static OPEN = 1 as const;
  static CLOSING = 2 as const;
  static CLOSED = 3 as const;
  CONNECTING = 0 as const;
  OPEN = 1 as const;
  CLOSING = 2 as const;
  CLOSED = 3 as const;

  private static instances: MockWebSocket[] = [];
  static reset(): void {
    MockWebSocket.instances = [];
  }
  static created(): number {
    return MockWebSocket.instances.length;
  }
  static last(): MockWebSocket | undefined {
    return MockWebSocket.instances.at(-1);
  }

  readyState: 0 | 1 | 2 | 3 = MockWebSocket.CONNECTING;
  url: string;
  onopen: ((ev: Event) => void) | null = null;
  onclose: ((ev: CloseEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;

  private sent: string[] = [];
  private listeners = new Map<string, Set<Listener>>();

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send(payload: string): void {
    this.sent.push(payload);
  }

  close(code?: number, _reason?: string): void {
    this.acceptClose(code ?? 1000);
  }

  addEventListener(event: string, fn: Listener): void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(fn);
  }
  removeEventListener(event: string, fn: Listener): void {
    this.listeners.get(event)?.delete(fn);
  }

  // ── Test helpers ──

  acceptOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    const ev = new Event('open');
    this.onopen?.(ev);
    this.fire('open', ev);
  }

  acceptClose(code: number): void {
    this.readyState = MockWebSocket.CLOSED;
    const ev = { code, reason: '', wasClean: code === 1000 } as CloseEvent;
    this.onclose?.(ev);
    this.fire('close', ev);
  }

  deliverRaw(data: string): void {
    const ev = { data } as MessageEvent;
    this.onmessage?.(ev);
    this.fire('message', ev);
  }

  deliverEnvelope(env: Envelope): void {
    const ev = { data: JSON.stringify(env) } as MessageEvent;
    this.onmessage?.(ev);
    this.fire('message', ev);
  }

  lastSentEnvelope(): Envelope | undefined {
    const last = this.sent.at(-1);
    return last ? (JSON.parse(last) as Envelope) : undefined;
  }

  allSentEnvelopes(): Envelope[] {
    return this.sent.map((s) => JSON.parse(s) as Envelope);
  }

  clearSent(): void {
    this.sent = [];
  }

  private fire(event: string, ev: unknown): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const fn of set) fn(ev);
  }
}
