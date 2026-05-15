import type { RpcResult, SideQuestionResult } from '@code-quest/schemas';
import type { Feature } from '@/lib/feature';
import type { msg } from '@/utils/message';

export const RECAP_PROMPT: string =
  'Recap the current session in under 40 words, 1-2 plain sentences, no markdown. ' +
  'Lead with the overall goal and current task, then the one next action. ' +
  'Skip root-cause narrative, fix internals, secondary to-dos, and em-dash tangents.';

interface RecapFeatureDeps {
  askSideQuestion: (question: string) => Promise<RpcResult<SideQuestionResult>>;
  appendMessage: (fields: Parameters<typeof msg>[0]) => void;
}

export function createRecapFeature({ askSideQuestion, appendMessage }: RecapFeatureDeps): Feature {
  const reply = (content: string) => appendMessage({ role: 'assistant', type: 'text', content });
  const fail = (reason: string) => reply(`(recap failed: ${reason})`);

  function invoke() {
    appendMessage({ role: 'user', type: 'text', content: '/recap' });
    askSideQuestion(RECAP_PROMPT)
      .then((result) => (result.ok ? reply(result.data.answer) : fail(result.error)))
      .catch((e: unknown) => fail(e instanceof Error ? e.message : String(e)));
  }

  return {
    id: 'recap',
    label: '/recap',
    section: 'Slash Commands',
    ui: { filterOnly: true },
    execute: invoke,
    slash: {
      command: '/recap',
      match: (message) => message.trim() === '/recap',
      invoke,
    },
  };
}
