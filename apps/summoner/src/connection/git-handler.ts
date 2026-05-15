import type { AgentTransport, GitService } from '@code-quest/schemas';
import type { AgentHandler } from './agent-handler.ts';
import { registerGitHandlers } from './git-handlers.ts';

export class GitHandler implements AgentHandler {
  private readonly git: GitService;

  constructor(git: GitService) {
    this.git = git;
  }

  attach(rpc: AgentTransport): void {
    registerGitHandlers(rpc, this.git);
  }
}
