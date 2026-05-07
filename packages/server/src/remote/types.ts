export interface RemoteRpc {
  request<R = unknown>(method: string, params: unknown): Promise<R>;
}

export interface RemoteRpcWithEvents extends RemoteRpc {
  on(event: string, fn: (...args: unknown[]) => void): () => void;
}
