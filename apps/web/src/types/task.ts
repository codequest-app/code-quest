export interface Task {
  toolUseId: string;
  taskType: 'local_bash' | 'local_agent' | 'subagent';
  status: 'running' | 'completed' | 'failed' | 'stopped';
  description: string;
  progressText?: string;
  lastToolName?: string;
  summary?: string;
  usage?: { inputTokens: number; outputTokens: number };
}
