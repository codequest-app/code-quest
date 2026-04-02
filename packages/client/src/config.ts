export const config = {
  serverUrl: (import.meta.env.VITE_SERVER_URL as string) || '',
  workspaceFolder: (import.meta.env.VITE_WORKSPACE_FOLDER as string) || '../',
} as const;
