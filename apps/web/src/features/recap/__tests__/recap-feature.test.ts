import type { RpcResult, SideQuestionResult } from '@code-quest/shared';
import { describe, expect, it, vi } from 'vitest';
import type { msg } from '@/utils/message';
import { createRecapFeature, RECAP_PROMPT } from '../recap-feature.ts';

type AskSideQuestion = (question: string) => Promise<RpcResult<SideQuestionResult>>;
type AppendMessage = (fields: Parameters<typeof msg>[0]) => void;

function setup(overrides?: { askSideQuestion?: AskSideQuestion; appendMessage?: AppendMessage }) {
  const askSideQuestion =
    overrides?.askSideQuestion ??
    vi.fn<AskSideQuestion>().mockResolvedValue({ ok: true, data: { answer: 'recap text' } });
  const appendMessage = overrides?.appendMessage ?? vi.fn<AppendMessage>();
  const feature = createRecapFeature({ askSideQuestion, appendMessage });
  return { feature, askSideQuestion, appendMessage };
}

describe('createRecapFeature', () => {
  it('is a slash command with id recap and command /recap', () => {
    const { feature } = setup();
    expect(feature.id).toBe('recap');
    expect(feature.slash?.command).toBe('/recap');
    expect(feature.ui?.filterOnly).toBe(true);
  });

  it('matches only bare /recap (trims whitespace)', () => {
    const { feature } = setup();
    expect(feature.slash?.match?.('/recap')).toBe(true);
    expect(feature.slash?.match?.('  /recap  ')).toBe(true);
    expect(feature.slash?.match?.('/recap foo')).toBe(false);
    expect(feature.slash?.match?.('/recaprude')).toBe(false);
  });

  it('invoke appends local "/recap" user message and sends RECAP_PROMPT as side question', () => {
    const { feature, askSideQuestion, appendMessage } = setup();
    feature.slash?.invoke('/recap');
    expect(appendMessage).toHaveBeenCalledWith({
      role: 'user',
      type: 'text',
      content: '/recap',
    });
    expect(askSideQuestion).toHaveBeenCalledWith(RECAP_PROMPT);
  });

  it('on success appends assistant answer locally', async () => {
    const { feature, appendMessage } = setup();
    feature.slash?.invoke('/recap');
    await vi.waitFor(() =>
      expect(appendMessage).toHaveBeenCalledWith({
        role: 'assistant',
        type: 'text',
        content: 'recap text',
      }),
    );
  });

  it('on failure appends an error assistant message locally', async () => {
    const askSideQuestion = vi
      .fn<AskSideQuestion>()
      .mockResolvedValue({ ok: false, error: 'boom' });
    const { feature, appendMessage } = setup({ askSideQuestion });
    feature.slash?.invoke('/recap');
    await vi.waitFor(() =>
      expect(appendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'assistant',
          type: 'text',
          content: expect.stringContaining('boom'),
        }),
      ),
    );
  });

  it('execute behaves like slash.invoke', () => {
    const { feature, askSideQuestion } = setup();
    feature.execute();
    expect(askSideQuestion).toHaveBeenCalledWith(RECAP_PROMPT);
  });

  it('RECAP_PROMPT matches the built-in /recap wording', () => {
    expect(RECAP_PROMPT).toContain('under 40 words');
    expect(RECAP_PROMPT).toContain('1-2 plain sentences');
  });
});
