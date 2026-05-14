export interface AgentTransport {
  emit(event: string, data: unknown): void;
  on(event: string, fn: (...args: unknown[]) => void): () => void;
  onRequest(event: string, handler: (data: unknown) => Promise<unknown>): () => void;
}
