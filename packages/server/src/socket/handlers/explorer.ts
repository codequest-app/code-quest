import { EVENTS, explorerBrowsePayloadSchema } from '@code-quest/shared';
import { logger } from '../../logger.ts';
import type { HandlerContext } from '../../types.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';

export function create({
  emitter,
  filesystemService: fs,
}: Pick<HandlerContext, 'emitter' | 'filesystemService'>): void {
  emitter.on(
    EVENTS.explorer.browse,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
      try {
        const { path } = explorerBrowsePayloadSchema.parse(payload);
        const directories = await fs.browseDirectories(path);
        callback?.({ directories });
      } catch (err) {
        logger.warn({ err }, 'Failed to browse directories');
        callback?.({ directories: [] });
      }
    },
  );
}
