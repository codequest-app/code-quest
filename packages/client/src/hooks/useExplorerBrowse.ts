import { type ExplorerDirectory, explorerBrowseResponseSchema } from '@code-quest/shared';
import { useSocket } from '../contexts/SocketContext';
import { rpc } from '../socket/rpc';

export function useExplorerBrowse() {
  const { socket } = useSocket();

  async function browse(path?: string): Promise<ExplorerDirectory[]> {
    const payload = path ? { path } : {};
    const response = await rpc(socket, 'explorer:browse', payload);
    const parsed = explorerBrowseResponseSchema.safeParse(response);
    return parsed.success ? parsed.data.directories : [];
  }

  return { browse };
}
