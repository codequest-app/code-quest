import type { AgentTransport } from '@code-quest/schemas';

export class FakeAgentTransport implements AgentTransport {
  private readonly handlers = new Map<string, (data: unknown) => Promise<unknown>>();
  readonly emitted: Array<[string, unknown]> = [];

  emit(event: string, data: unknown): void {
    this.emitted.push([event, data]);
  }

  on(_event: string, _fn: (...args: unknown[]) => void): () => void {
    return () => {};
  }

  onRequest(event: string, handler: (data: unknown) => Promise<unknown>): () => void {
    this.handlers.set(event, handler);
    return () => this.handlers.delete(event);
  }

  request(method: string, params: unknown): Promise<unknown> | undefined {
    return this.handlers.get(method)?.(params);
  }
}
