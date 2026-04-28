import type { RpcResult } from '@code-quest/shared';
import { useSyncExternalStore } from 'react';
import type { Feature } from '../../lib/feature';

type Subscriber = () => void;

export interface BtwState {
  open: boolean;
  question: string;
  answer: string | null;
  loading: boolean;
  error: string | null;
}

interface BtwSignal {
  getState(): BtwState;
  subscribe(cb: Subscriber): () => void;
  setState(update: Partial<BtwState>): void;
}

const BTW_COMMAND = '/btw';
const CLOSED: BtwState = { open: false, question: '', answer: null, loading: false, error: null };

function createBtwSignal(): BtwSignal {
  let state: BtwState = CLOSED;
  const subscribers = new Set<Subscriber>();

  function notify() {
    for (const cb of subscribers) cb();
  }

  return {
    getState: () => state,
    subscribe(cb) {
      subscribers.add(cb);
      return () => subscribers.delete(cb);
    },
    setState(update) {
      state = { ...state, ...update };
      notify();
    },
  };
}

export const btwSignal: BtwSignal = createBtwSignal();

export interface BtwFeatureDeps {
  askSideQuestion: (question: string) => Promise<RpcResult<{ answer: string }>>;
}

export function createBtwFeature({ askSideQuestion }: BtwFeatureDeps): Feature {
  function invoke(message: string) {
    const question = message.trim().slice(BTW_COMMAND.length).trim();
    if (!question) return;
    btwSignal.setState({ open: true, question, answer: null, loading: true, error: null });
    askSideQuestion(question)
      .then((result) => {
        if (result.ok) {
          btwSignal.setState({ loading: false, answer: result.data.answer });
        } else {
          btwSignal.setState({ loading: false, error: result.error });
        }
      })
      .catch((e: unknown) => {
        btwSignal.setState({
          loading: false,
          error: e instanceof Error ? e.message : String(e),
        });
      });
  }

  return {
    id: 'btw',
    label: BTW_COMMAND,
    section: 'Slash Commands',
    ui: { matchFirstToken: true },
    execute() {
      // Menu click with no slashFilter context — no-op; live invocation happens
      // via createBtwLocalFeature (wrapping this base + current slashFilter).
    },
    slash: {
      command: BTW_COMMAND,
      match(message) {
        const trimmed = message.trim();
        return trimmed === BTW_COMMAND || trimmed.startsWith(`${BTW_COMMAND} `);
      },
      invoke,
    },
  };
}

interface BtwLocalFeatureDeps {
  slashFilter: string | null;
  baseFeature: Feature;
}

/** Per-render overlay: takes the registered `btw` Feature plus the current
 *  slashFilter, produces a Feature whose `disabled` + `execute` reflect the
 *  live question. Registered separately in CommandMenu per render. */
export function createBtwLocalFeature({ slashFilter, baseFeature }: BtwLocalFeatureDeps): Feature {
  const question = slashFilter?.startsWith('btw ') ? slashFilter.slice(4).trim() : null;
  return {
    ...baseFeature,
    disabled: !question,
    execute() {
      if (question) baseFeature.slash?.invoke(`/btw ${question}`);
    },
  };
}

export function useBtwState(): BtwState {
  return useSyncExternalStore(
    (cb) => btwSignal.subscribe(cb),
    () => btwSignal.getState(),
  );
}
