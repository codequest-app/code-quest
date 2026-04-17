import type { RpcResult } from '@code-quest/shared';
import type { SlashCommandFeature } from '../../lib/feature';

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

export const btwSignal = createBtwSignal();

export interface BtwFeatureDeps {
  askSideQuestion: (question: string) => Promise<RpcResult<{ answer: string }>>;
}

export function createBtwFeature({ askSideQuestion }: BtwFeatureDeps): SlashCommandFeature {
  return {
    id: 'btw',
    command: '/btw',
    match(message) {
      const trimmed = message.trim();
      return trimmed === '/btw' || trimmed.startsWith('/btw ');
    },
    invoke(message) {
      const question = message.trim().slice(4).trim();
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
    },
  };
}
