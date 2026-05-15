import type { AgentTransport, FilesystemService } from '@code-quest/schemas';
import type { AgentHandler } from './agent-handler.ts';
import { registerFsHandlers } from './fs-handlers.ts';

export class FsHandler implements AgentHandler {
  private readonly filesystem: FilesystemService;

  constructor(filesystem: FilesystemService) {
    this.filesystem = filesystem;
  }

  attach(rpc: AgentTransport): void {
    registerFsHandlers(rpc, this.filesystem);
  }
}
