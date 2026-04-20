import type { ControlResponse } from '@code-quest/shared';
import type { ResolvedControlResponse } from '@code-quest/summoner';
import type { RequestMeta } from './schemas.ts';

/** Default timeout for control requests (ms). */
export const DEFAULT_CONTROL_TIMEOUT = 30_000;

interface PendingRequest {
  resolve: (value: ControlResponse) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

/** Sends a control request to the CLI runner. Returns the generated requestId. */
export type ControlRequestSender = (
  subtype: string,
  params: Record<string, unknown> | undefined,
  requestId: string,
) => void;

/** Owns both directions of control-request state:
 *   - inbound (CLI→server, awaiting client UI response): `meta` map
 *   - outbound (server→CLI, awaiting CLI ack): `pending` map with 30s timer */
export class ControlRequestTracker {
  private readonly meta = new Map<string, RequestMeta>();
  private readonly pending = new Map<string, PendingRequest>();

  constructor(private readonly timeoutMs: number = DEFAULT_CONTROL_TIMEOUT) {}

  // ── Inbound (CLI→server) ──

  trackInbound(requestId: string, meta: RequestMeta): void {
    this.meta.set(requestId, meta);
  }

  removeInbound(requestId: string): void {
    this.meta.delete(requestId);
  }

  hasInbound(requestId: string): boolean {
    return this.meta.has(requestId);
  }

  getInboundMeta(requestId: string): RequestMeta | undefined {
    return this.meta.get(requestId);
  }

  // ── Outbound (server→CLI) ──

  sendOutbound(
    send: ControlRequestSender,
    subtype: string,
    params?: Record<string, unknown>,
  ): Promise<ControlResponse> {
    const requestId = crypto.randomUUID();
    return new Promise<ControlResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error(`Control request '${subtype}' timed out`));
      }, this.timeoutMs);

      this.pending.set(requestId, { resolve, reject, timer });
      send(subtype, params, requestId);
    });
  }

  resolveOutbound(response: ResolvedControlResponse): void {
    const p = this.pending.get(response.requestId);
    if (!p) return;
    clearTimeout(p.timer);
    this.pending.delete(response.requestId);
    p.resolve({
      success: response.success,
      response: response.response,
      error: response.error,
    });
  }

  /** Reject all outstanding outbound requests. Used on process exit / destroy. */
  rejectAllPending(reason: string): void {
    for (const [id, p] of this.pending) {
      clearTimeout(p.timer);
      p.reject(new Error(reason));
      this.pending.delete(id);
    }
  }

  clear(): void {
    this.meta.clear();
    this.rejectAllPending('Channel destroyed');
  }
}
