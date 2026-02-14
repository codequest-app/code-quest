export type ChatProvider = 'claude' | 'gemini';

export interface ChatStats {
  costUsd?: number;
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
}

export type ChatStreamEvent =
  | { type: 'init'; data: { sessionId: string } }
  | { type: 'text'; data: { content: string } }
  | { type: 'thinking'; data: { content: string } }
  | { type: 'tool_use'; data: { id: string; name: string; input: unknown } }
  | { type: 'tool_result'; data: { name: string; output: string } }
  | { type: 'result'; data: { stats: ChatStats } }
  | { type: 'error'; data: { message: string } }
  | { type: 'permission_request'; data: { toolName: string; description: string } };

export type OrchestratorStatus =
  | 'idle'
  | 'dispatching'
  | 'workers-running'
  | 'merging'
  | 'workers-complete'
  | 'synthesizing'
  | 'complete'
  | 'error';

export interface SubTask {
  description: string;
  provider: ChatProvider;
  dependsOn?: number[];
}

export interface WorkerInfo {
  id: string;
  task: SubTask;
  status: 'pending' | 'running' | 'complete' | 'error';
  result?: string;
  stats?: ChatStats;
  error?: string;
  wave?: number;
}

export interface SystemCapabilities {
  worktree: boolean;
}
