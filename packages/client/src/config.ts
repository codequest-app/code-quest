export const config = {
  serverUrl: String(import.meta.env.VITE_SERVER_URL ?? ''),
  defaultCwd: String(import.meta.env.VITE_WORKSPACE_FOLDER ?? '../../'),
} as const;
