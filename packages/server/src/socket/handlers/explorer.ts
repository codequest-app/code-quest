import { explorerBrowsePayloadSchema } from '@code-quest/shared';
import type { FilesystemService } from '@code-quest/summoner';
import { logger } from '../../logger.ts';
import type { ChannelEmitter } from '../channel-emitter.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';

export function create(emitter: ChannelEmitter, fs: FilesystemService): void {
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
