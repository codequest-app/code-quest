import { randomUUID } from 'node:crypto';
import type { ChatManager, ChatSession, ChatStats, ChatStreamEvent } from '../chat/types';
import type { OrchestratorSession, OrchestratorStatus, SubTask, WorkerInfo } from './types';

interface OrchestratorSessionOptions {
  chatManager: ChatManager;
  provider: 'claude' | 'gemini';
}

export class OrchestratorSessionImpl implements OrchestratorSession {
  readonly id: string;
  readonly coordinatorId: string;

  private _status: OrchestratorStatus = 'idle';
  private _workers: WorkerInfo[] = [];
  private readonly chatManager: ChatManager;
  private readonly coordinatorSession: ChatSession;
  private workerSessions: Map<string, ChatSession> = new Map();

  private statusChangeHandlers: Array<(status: OrchestratorStatus) => void> = [];
  private workerEventHandlers: Array<(workerId: string, event: ChatStreamEvent) => void> = [];
  private workerCompleteHandlers: Array<(workerId: string, result: WorkerInfo) => void> = [];
  private completeHandlers: Array<(stats: ChatStats) => void> = [];
  private errorHandlers: Array<(message: string) => void> = [];

  get status(): OrchestratorStatus {
    return this._status;
  }

  get workers(): WorkerInfo[] {
    return [...this._workers];
  }

  constructor(options: OrchestratorSessionOptions) {
    this.id = randomUUID();
    this.chatManager = options.chatManager;
    this.coordinatorSession = this.chatManager.createSession({ provider: options.provider });
    this.coordinatorId = this.coordinatorSession.id;
  }

  dispatch(tasks: SubTask[]): void {
    if (this._status !== 'idle') {
      this.emitError('Cannot dispatch: orchestrator is not idle');
      return;
    }

    this.setStatus('dispatching');
    this._workers = [];

    for (const task of tasks) {
      const workerSession = this.chatManager.createSession({ provider: task.provider });
      const workerInfo: WorkerInfo = {
        id: workerSession.id,
        task,
        status: 'pending',
        result: '',
      };
      this._workers.push(workerInfo);
      this.workerSessions.set(workerSession.id, workerSession);
    }

    this.setStatus('workers-running');

    // Start all workers
    for (const worker of this._workers) {
      this.startWorker(worker);
    }
  }

  synthesize(): void {
    if (this._status !== 'workers-complete') {
      this.emitError('Cannot synthesize: workers are not complete');
      return;
    }

    this.setStatus('synthesizing');

    // Build synthesis prompt
    const parts: string[] = ['以下是各子任務的執行結果，請彙整成最終回覆：\n'];
    this._workers.forEach((worker, index) => {
      const providerLabel = worker.task.provider === 'claude' ? 'Claude' : 'Gemini';
      parts.push(`## Worker ${index + 1}: ${worker.task.description} (${providerLabel})`);
      parts.push(worker.result || '(no output)');
      parts.push('');
    });
    parts.push('請根據以上結果進行彙整。');

    const synthesisPrompt = parts.join('\n');

    // Listen for coordinator completion
    this.coordinatorSession.onComplete((_stats) => {
      this.setStatus('complete');
      this.emitComplete(this.getAggregatedStats());
    });

    this.coordinatorSession.onError((message) => {
      this.setStatus('error');
      this.emitError(message);
    });

    // Persistent process: just write to stdin
    this.coordinatorSession.sendMessage(synthesisPrompt);
  }

  abort(): void {
    // Abort all running workers
    for (const [_id, session] of this.workerSessions) {
      session.abort();
    }
    // Abort coordinator
    this.coordinatorSession.abort();
    this.setStatus('error');
  }

  kill(): void {
    for (const [_id, session] of this.workerSessions) {
      session.kill();
    }
    this.coordinatorSession.kill();
    this.chatManager.removeSession(this.coordinatorId);
    for (const worker of this._workers) {
      this.chatManager.removeSession(worker.id);
    }
  }

  getWorkerResults(): WorkerInfo[] {
    return this._workers.filter((w) => w.status === 'complete');
  }

  getAggregatedStats(): ChatStats {
    const stats: ChatStats = {
      costUsd: 0,
      durationMs: 0,
      inputTokens: 0,
      outputTokens: 0,
    };

    for (const worker of this._workers) {
      if (worker.stats) {
        stats.costUsd = (stats.costUsd ?? 0) + (worker.stats.costUsd ?? 0);
        stats.durationMs = Math.max(stats.durationMs ?? 0, worker.stats.durationMs ?? 0);
        stats.inputTokens = (stats.inputTokens ?? 0) + (worker.stats.inputTokens ?? 0);
        stats.outputTokens = (stats.outputTokens ?? 0) + (worker.stats.outputTokens ?? 0);
      }
    }

    return stats;
  }

  onStatusChange(handler: (status: OrchestratorStatus) => void): void {
    this.statusChangeHandlers.push(handler);
  }

  onWorkerEvent(handler: (workerId: string, event: ChatStreamEvent) => void): void {
    this.workerEventHandlers.push(handler);
  }

  onWorkerComplete(handler: (workerId: string, result: WorkerInfo) => void): void {
    this.workerCompleteHandlers.push(handler);
  }

  onComplete(handler: (stats: ChatStats) => void): void {
    this.completeHandlers.push(handler);
  }

  onError(handler: (message: string) => void): void {
    this.errorHandlers.push(handler);
  }

  private startWorker(worker: WorkerInfo): void {
    const session = this.workerSessions.get(worker.id);
    if (!session) return;

    worker.status = 'running';

    session.onEvent((event) => {
      if (event.type === 'text') {
        worker.result = (worker.result ?? '') + event.data.content;
      }
      for (const handler of this.workerEventHandlers) {
        handler(worker.id, event);
      }
    });

    session.onComplete((stats) => {
      worker.status = 'complete';
      worker.stats = stats;
      for (const handler of this.workerCompleteHandlers) {
        handler(worker.id, { ...worker });
      }
      this.checkAllWorkersComplete();
    });

    session.onError((message) => {
      worker.status = 'error';
      worker.error = message;
      for (const handler of this.workerCompleteHandlers) {
        handler(worker.id, { ...worker });
      }
      this.checkAllWorkersComplete();
    });

    session.sendMessage(worker.task.description);
  }

  private checkAllWorkersComplete(): void {
    const allDone = this._workers.every((w) => w.status === 'complete' || w.status === 'error');
    if (allDone && this._status === 'workers-running') {
      this.setStatus('workers-complete');
    }
  }

  private setStatus(status: OrchestratorStatus): void {
    this._status = status;
    for (const handler of this.statusChangeHandlers) {
      handler(status);
    }
  }

  private emitComplete(stats: ChatStats): void {
    for (const handler of this.completeHandlers) {
      handler(stats);
    }
  }

  private emitError(message: string): void {
    for (const handler of this.errorHandlers) {
      handler(message);
    }
  }
}
