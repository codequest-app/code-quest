import { randomUUID } from 'node:crypto';
import type {
  ChatStats,
  ChatStreamEvent,
  OrchestratorStatus,
  SubTask,
  WorkerInfo,
} from '@code-quest/shared';
import type { ChatManager, ChatSession } from '../chat/types.ts';
import type { GitService } from '../git/types.ts';
import type { OrchestratorSession } from './types.ts';
import { calculateWaves, type Wave } from './wave-calculator.ts';

interface OrchestratorSessionOptions {
  chatManager: ChatManager;
  gitService: GitService;
  provider: 'claude' | 'gemini';
}

export class OrchestratorSessionImpl implements OrchestratorSession {
  readonly id: string;
  readonly coordinatorId: string;

  private _status: OrchestratorStatus = 'idle';
  private _workers: WorkerInfo[] = [];
  private readonly chatManager: ChatManager;
  private readonly gitService: GitService;
  private readonly coordinatorSession: ChatSession;
  private workerSessions: Map<string, ChatSession> = new Map();

  private waves: Wave[] = [];
  private currentWave = 0;
  private workerWaveMap: Map<string, number> = new Map();
  private autoCommitted = false;

  private statusChangeHandlers: Array<(status: OrchestratorStatus) => void> = [];
  private workerEventHandlers: Array<(workerId: string, event: ChatStreamEvent) => void> = [];
  private workerCompleteHandlers: Array<(workerId: string, result: WorkerInfo) => void> = [];
  private completeHandlers: Array<(stats: ChatStats) => void> = [];
  private errorHandlers: Array<(message: string) => void> = [];
  private mergeErrorHandlers: Array<(workerId: string, error: string) => void> = [];
  private workerWorktreeHandlers: Array<
    (workerId: string, worktreePath: string, branch: string) => void
  > = [];
  private workersUpdatedHandlers: Array<(workers: WorkerInfo[]) => void> = [];

  get status(): OrchestratorStatus {
    return this._status;
  }

  get workers(): WorkerInfo[] {
    return [...this._workers];
  }

  constructor(options: OrchestratorSessionOptions) {
    this.id = randomUUID();
    this.chatManager = options.chatManager;
    this.gitService = options.gitService;
    this.coordinatorSession = this.chatManager.createSession({ provider: options.provider });
    this.coordinatorId = this.coordinatorSession.id;
  }

  async dispatch(tasks: SubTask[]): Promise<void> {
    if (this._status !== 'idle') {
      this.emitError('Cannot dispatch: orchestrator is not idle');
      return;
    }

    this.setStatus('dispatching');
    this.waves = calculateWaves(tasks);
    this._workers = [];

    // Create all WorkerInfo up front (pending, no session yet)
    for (let i = 0; i < tasks.length; i++) {
      const waveIndex = this.waves.findIndex((w) => w.indices.includes(i));
      this._workers.push({
        id: `pending-${i}`,
        task: tasks[i],
        status: 'pending',
        result: '',
        wave: waveIndex,
      });
    }

    // Auto-commit so worktrees include untracked/uncommitted files
    if (this.gitService.isWorktreeSupported()) {
      try {
        this.autoCommitted = await this.gitService.autoCommitAll();
      } catch {
        // Fallback: proceed without worktree support if auto-commit fails
      }
    }

    this.setStatus('workers-running');
    await this.startWave(0);
  }

  skipWorker(workerId: string): void {
    const worker = this._workers.find((w) => w.id === workerId);
    if (!worker || worker.status !== 'error') {
      this.emitError(`Cannot skip worker "${workerId}": not found or not in error state`);
      return;
    }

    worker.status = 'skipped';
    this.checkPausedResolved();
  }

  synthesize(): void {
    if (this._status !== 'workers-complete' && this._status !== 'workers-paused') {
      this.emitError('Cannot synthesize: workers are not complete');
      return;
    }

    this.setStatus('synthesizing');

    // Build synthesis prompt
    const parts: string[] = ['以下是各子任務的執行結果，請彙整成最終回覆：\n'];
    this._workers.forEach((worker, index) => {
      const providerLabel = worker.task.provider === 'claude' ? 'Claude' : 'Gemini';
      parts.push(`## Worker ${index + 1}: ${worker.task.description} (${providerLabel})`);
      if (worker.status === 'skipped') {
        parts.push(`⚠️ 此任務被跳過。失敗原因：${worker.error ?? 'unknown'}`);
      } else if (worker.status === 'error') {
        parts.push(`❌ 此任務失敗。錯誤訊息：${worker.error ?? 'unknown'}`);
      } else {
        parts.push(worker.result || '(no output)');
      }
      parts.push('');
    });
    parts.push('請根據以上結果進行彙整。');

    const synthesisPrompt = parts.join('\n');

    this.coordinatorSession.onComplete((_stats) => {
      this.setStatus('complete');
      this.emitComplete(this.getAggregatedStats());
    });

    this.coordinatorSession.onError((message) => {
      this.setStatus('error');
      this.emitError(message);
    });

    this.coordinatorSession.sendMessage(synthesisPrompt);
  }

  abort(): void {
    for (const [_id, session] of this.workerSessions) {
      session.abort();
    }
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

    // Cleanup all worktrees
    if (this.gitService.isWorktreeSupported()) {
      const ids = this._workers.map((_, i) => `${this.id}-${i}`);
      this.gitService.cleanupAll(ids).catch(() => {});

      if (this.autoCommitted) {
        this.gitService.resetLastCommit().catch(() => {});
        this.autoCommitted = false;
      }
    }
  }

  retryWorker(workerId: string): void {
    const worker = this._workers.find((w) => w.id === workerId);
    if (!worker || worker.status !== 'error') {
      this.emitError(`Cannot retry worker "${workerId}": not found or not in error state`);
      return;
    }

    // Kill old session if it exists
    const oldSession = this.workerSessions.get(workerId);
    if (oldSession) {
      oldSession.kill();
      this.chatManager.removeSession(workerId);
      this.workerSessions.delete(workerId);
    }

    // Reset worker state
    worker.status = 'pending';
    worker.error = undefined;
    worker.result = '';
    worker.stats = undefined;

    // Find the task index for worktree ID
    const taskIndex = this._workers.indexOf(worker);

    // Create worktree if needed
    const setupAndStart = async () => {
      let cwd: string | undefined;

      if (this.gitService.isWorktreeSupported()) {
        // Ensure auto-commit exists for worktree
        if (!this.autoCommitted) {
          try {
            this.autoCommitted = await this.gitService.autoCommitAll();
          } catch {
            // Proceed without worktree if auto-commit fails
          }
        }

        try {
          const worktreeId = `${this.id}-${taskIndex}`;
          // Remove old worktree first
          await this.gitService.removeWorktree(worktreeId);
          cwd = await this.gitService.createWorktree(worktreeId);
        } catch {
          // Fallback to shared cwd
        }
      }

      const session = this.chatManager.createSession({ provider: worker.task.provider, cwd });
      worker.id = session.id;
      this.workerSessions.set(session.id, session);
      this.workerWaveMap.set(session.id, worker.wave ?? 0);

      // If status was workers-complete or workers-paused, go back to workers-running
      if (this._status === 'workers-complete' || this._status === 'workers-paused') {
        this.setStatus('workers-running');
      }

      this.startWorker(worker);
    };

    setupAndStart().catch((err) => {
      const message = err instanceof Error ? err.message : String(err);
      this.emitError(`Failed to retry worker: ${message}`);
    });
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

  onMergeError(handler: (workerId: string, error: string) => void): void {
    this.mergeErrorHandlers.push(handler);
  }

  onWorkerWorktree(
    handler: (workerId: string, worktreePath: string, branch: string) => void,
  ): void {
    this.workerWorktreeHandlers.push(handler);
  }

  onWorkersUpdated(handler: (workers: WorkerInfo[]) => void): void {
    this.workersUpdatedHandlers.push(handler);
  }

  private async startWave(waveIndex: number): Promise<void> {
    this.currentWave = waveIndex;
    const wave = this.waves[waveIndex];

    for (const taskIndex of wave.indices) {
      const worker = this._workers[taskIndex];
      let cwd: string | undefined;

      if (this.gitService.isWorktreeSupported()) {
        try {
          const worktreeId = `${this.id}-${taskIndex}`;
          cwd = await this.gitService.createWorktree(worktreeId);
        } catch {
          // Fallback to shared cwd if worktree creation fails
        }
      }

      const session = this.chatManager.createSession({ provider: worker.task.provider, cwd });
      worker.id = session.id;
      this.workerSessions.set(session.id, session);
      this.workerWaveMap.set(session.id, waveIndex);

      if (cwd) {
        const worktreeId = `${this.id}-${taskIndex}`;
        const branch = `worktree/${worktreeId}`;
        for (const handler of this.workerWorktreeHandlers) {
          handler(session.id, cwd, branch);
        }
      }
    }

    // Notify client of updated worker IDs BEFORE starting workers
    // so events arrive with IDs the client already knows
    for (const handler of this.workersUpdatedHandlers) {
      handler([...this._workers]);
    }

    for (const taskIndex of wave.indices) {
      const worker = this._workers[taskIndex];
      this.startWorker(worker);
    }
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

  private async checkAllWorkersComplete(): Promise<void> {
    const currentWaveIndices = this.waves[this.currentWave].indices;
    const waveWorkers = currentWaveIndices.map((i) => this._workers[i]);
    const allDone = waveWorkers.every(
      (w) => w.status === 'complete' || w.status === 'error' || w.status === 'skipped',
    );

    if (!allDone || this._status !== 'workers-running') return;

    // Merge worktrees if supported
    if (this.gitService.isWorktreeSupported()) {
      this.setStatus('merging');
      for (const idx of currentWaveIndices) {
        const worker = this._workers[idx];
        if (worker.status !== 'complete') continue;
        const worktreeId = `${this.id}-${idx}`;
        const result = await this.gitService.mergeWorktreeBranch(worktreeId);
        if (!result.success) {
          worker.status = 'error';
          worker.error = `Merge conflict: ${result.error}`;
          this.emitMergeError(worker.id, result.error ?? 'merge failed');
        }
      }
      // Cleanup worktrees for this wave
      const ids = currentWaveIndices.map((i) => `${this.id}-${i}`);
      await this.gitService.cleanupAll(ids);
    }

    // Check if any workers have errors — pause for user decision
    const hasErrors = waveWorkers.some((w) => w.status === 'error');
    if (hasErrors) {
      this.setStatus('workers-paused');
      return;
    }

    await this.advanceAfterWave();
  }

  private checkPausedResolved(): void {
    if (this._status !== 'workers-paused') return;

    const currentWaveIndices = this.waves[this.currentWave].indices;
    const waveWorkers = currentWaveIndices.map((i) => this._workers[i]);
    const hasErrors = waveWorkers.some((w) => w.status === 'error');

    if (!hasErrors) {
      this.advanceAfterWave().catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        this.emitError(`Failed to advance after wave: ${message}`);
      });
    }
  }

  private async advanceAfterWave(): Promise<void> {
    if (this.currentWave + 1 < this.waves.length) {
      this.setStatus('workers-running');
      this.startWave(this.currentWave + 1);
    } else {
      // Reset auto-commit after all waves complete
      if (this.autoCommitted) {
        await this.gitService.resetLastCommit();
        this.autoCommitted = false;
      }
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

  private emitMergeError(workerId: string, error: string): void {
    for (const handler of this.mergeErrorHandlers) {
      handler(workerId, error);
    }
  }
}
