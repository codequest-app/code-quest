export interface MinimalLogger {
  debug(obj: object, msg: string): void;
  warn(msg: string): void;
  error(obj: object, msg: string): void;
}

export interface RemoteRpc {
  request<R = unknown>(method: string, params: unknown): Promise<R>;
}
