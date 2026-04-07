import { type ExplorerDirectory, explorerBrowseResponseSchema } from '@code-quest/shared';
import { useSocket } from '../contexts/SocketContext';

export function useExplorerBrowse() {
  const { socket } = useSocket();

  function browse(path?: string): Promise<ExplorerDirectory[]> {
    return new Promise((resolve) => {
      const payload = path ? { path } : {};
      (socket.emit as (...args: unknown[]) => unknown)(
        'explorer:browse',
        payload,
        (response: unknown) => {
          const parsed = explorerBrowseResponseSchema.safeParse(response);
          resolve(parsed.success ? parsed.data.directories : []);
        },
      );
    });
  }

  return { browse };
}
