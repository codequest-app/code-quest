import type { PlanCommentData } from '@code-quest/shared';
import type { ChannelState } from '@/types/chat';
import type { Payload } from './guard';

// ── On handlers ──

function onPlanCommentAdded(state: ChannelState, p: Payload<'plan:comment_added'>): ChannelState {
  return { ...state, planComments: [...state.planComments, p.comment] };
}

function onPlanCommentRemoved(
  state: ChannelState,
  p: Payload<'plan:comment_removed'>,
): ChannelState {
  return { ...state, planComments: state.planComments.filter((c) => c.id !== p.commentId) };
}

export const planHandlerOn = {
  'plan:comment_added': onPlanCommentAdded,
  'plan:comment_removed': onPlanCommentRemoved,
} satisfies Record<string, (state: ChannelState, payload: never) => ChannelState>;

// ── Actions (emit) ──

interface PlanActionsDeps {
  setChannelState: (fn: (prev: ChannelState) => ChannelState) => void;
}

export function createPlanActions({ setChannelState }: PlanActionsDeps) {
  function addPlanComment(comment: PlanCommentData) {
    setChannelState((prev) => ({ ...prev, planComments: [...prev.planComments, comment] }));
  }

  function clearPlanComments() {
    setChannelState((prev) => ({ ...prev, planComments: [] }));
  }

  return { addPlanComment, clearPlanComments };
}
