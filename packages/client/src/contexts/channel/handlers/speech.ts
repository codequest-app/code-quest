// ── On handler: (state, payload) → newState ──

interface ComposeState {
  value: string;
  cursorPos: number;
  slashOpen: boolean;
  mentionOpen: boolean;
  attachedFiles: File[];
}

function onSpeechMessage(
  state: ComposeState,
  payload: { channelId: string; text: string },
): ComposeState {
  return {
    ...state,
    value: state.value ? `${state.value} ${payload.text}` : payload.text,
  };
}

export const composeHandlers = {
  'speech:message': onSpeechMessage,
} satisfies Record<string, (state: ComposeState, payload: never) => ComposeState>;
