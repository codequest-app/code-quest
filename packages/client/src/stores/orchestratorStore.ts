import type { ChatProvider, OrchestratorStatus, WorkerInfo } from '@code-quest/shared';
import { create } from 'zustand';

export interface OrchestratorState {
  orchestratorId: string;
  coordinatorId: string;
  provider: ChatProvider;
  status: OrchestratorStatus;
  workers: WorkerInfo[];
  errorMessage?: string;
  selectedWorkerId?: string;
}

interface OrchestratorStore {
  orchestrators: Map<string, OrchestratorState>;

  initOrchestrator: (orchId: string, coordinatorId: string, provider: ChatProvider) => void;
  setWorkers: (orchId: string, workers: WorkerInfo[]) => void;
  updateWorkerStatus: (orchId: string, workerId: string, update: Partial<WorkerInfo>) => void;
  setStatus: (orchId: string, status: OrchestratorStatus) => void;
  setError: (orchId: string, message: string) => void;
  selectWorker: (orchId: string, workerId: string) => void;
  setAllComplete: (orchId: string, results: WorkerInfo[]) => void;
  removeOrchestrator: (orchId: string) => void;
  getOrchestrator: (orchId: string) => OrchestratorState | undefined;
}

export const useOrchestratorStore = create<OrchestratorStore>((set, get) => ({
  orchestrators: new Map(),

  initOrchestrator: (orchId: string, coordinatorId: string, provider: ChatProvider) => {
    set((state) => {
      const orchestrators = new Map(state.orchestrators);
      orchestrators.set(orchId, {
        orchestratorId: orchId,
        coordinatorId,
        provider,
        status: 'idle',
        workers: [],
      });
      return { orchestrators };
    });
  },

  setWorkers: (orchId: string, workers: WorkerInfo[]) => {
    set((state) => {
      const orchestrators = new Map(state.orchestrators);
      const orch = orchestrators.get(orchId);
      if (!orch) return state;
      const selectedStillValid =
        orch.selectedWorkerId && workers.some((w) => w.id === orch.selectedWorkerId);
      const selectedWorkerId = selectedStillValid
        ? orch.selectedWorkerId
        : (workers[0]?.id ?? undefined);
      orchestrators.set(orchId, { ...orch, workers: [...workers], selectedWorkerId });
      return { orchestrators };
    });
  },

  updateWorkerStatus: (orchId: string, workerId: string, update: Partial<WorkerInfo>) => {
    set((state) => {
      const orchestrators = new Map(state.orchestrators);
      const orch = orchestrators.get(orchId);
      if (!orch) return state;

      const workers = orch.workers.map((w) => (w.id === workerId ? { ...w, ...update } : w));
      orchestrators.set(orchId, { ...orch, workers });
      return { orchestrators };
    });
  },

  setStatus: (orchId: string, status: OrchestratorStatus) => {
    set((state) => {
      const orchestrators = new Map(state.orchestrators);
      const orch = orchestrators.get(orchId);
      if (!orch) return state;
      orchestrators.set(orchId, { ...orch, status });
      return { orchestrators };
    });
  },

  setError: (orchId: string, message: string) => {
    set((state) => {
      const orchestrators = new Map(state.orchestrators);
      const orch = orchestrators.get(orchId);
      if (!orch) return state;
      orchestrators.set(orchId, { ...orch, status: 'error', errorMessage: message });
      return { orchestrators };
    });
  },

  selectWorker: (orchId: string, workerId: string) => {
    set((state) => {
      const orchestrators = new Map(state.orchestrators);
      const orch = orchestrators.get(orchId);
      if (!orch) return state;
      orchestrators.set(orchId, { ...orch, selectedWorkerId: workerId });
      return { orchestrators };
    });
  },

  setAllComplete: (orchId: string, results: WorkerInfo[]) => {
    set((state) => {
      const orchestrators = new Map(state.orchestrators);
      const orch = orchestrators.get(orchId);
      if (!orch) return state;
      orchestrators.set(orchId, { ...orch, workers: [...results], status: 'workers-complete' });
      return { orchestrators };
    });
  },

  removeOrchestrator: (orchId: string) => {
    set((state) => {
      const orchestrators = new Map(state.orchestrators);
      orchestrators.delete(orchId);
      return { orchestrators };
    });
  },

  getOrchestrator: (orchId: string) => {
    return get().orchestrators.get(orchId);
  },
}));
