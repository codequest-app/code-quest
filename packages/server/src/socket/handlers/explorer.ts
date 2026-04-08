import { explorerBrowsePayloadSchema } from '@code-quest/shared';
import { logger } from '../../logger.ts';
import type { HandlerContext } from '../../types.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';

export function create({
  emitter,
  filesystemService: fs,
}: Pick<HandlerContext, 'emitter' | 'filesystemService'>): void {
  emitter.on(
    'explorer:browse',
    (_ch, payload: unknown, _socket?: TypedSocket, cb?: SocketCallback) => {
      try {
        const { path } = explorerBrowsePayloadSchema.parse(payload);
        const directories = fs.browseDirectories(path);
        cb?.({ directories });
      } catch (err) {
        logger.warn({ err }, 'Failed to browse directories');
        cb?.({ directories: [] });
      }
    },
  );
}
