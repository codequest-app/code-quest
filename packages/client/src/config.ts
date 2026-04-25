/** Transport selector — pick which socket implementation `createSocket()` returns. */
export type ClientTransport = 'ws' | 'socketio';

function parseTransport(raw: string | undefined): ClientTransport {
  return raw === 'socketio' ? 'socketio' : 'ws';
}

export const config = {
  serverUrl: String(import.meta.env.VITE_SERVER_URL ?? ''),
  defaultCwd: String(import.meta.env.VITE_WORKSPACE_FOLDER ?? '../../'),
  transport: parseTransport(import.meta.env.VITE_TRANSPORT as string | undefined),
} as const;
