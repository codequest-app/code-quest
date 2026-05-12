import { segments as s } from '@code-quest/summoner/test';
import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useChannelStore } from '@/stores/ChannelStoreContext';
import { renderWithChannel } from '@/test/render-with-channel';

function ErrorProbe() {
  const messages = useChannelStore((s) => s.messages);
  const errs = messages.filter(
    (m) => m.role === 'system' && m.type === 'error' && m.content !== 'Session not found',
  );
  return (
    <ul aria-label="errors">
      {errs.map((m, i) => (
        <li
          key={m.id}
          role="status"
          aria-label={`err-${i}`}
          data-content={m.content}
          data-detail={
            m.type === 'error' ? (('detail' in m ? (m.detail as string) : undefined) ?? '') : ''
          }
        />
      ))}
    </ul>
  );
}

describe('error:message handler — kind classification', () => {
  it('aborted_streaming errors classify as kind tags with full text in meta.detail', async () => {
    const { claude } = await renderWithChannel(<ErrorProbe />);

    await act(async () => {
      await claude.emitSegment(
        s.resultError({
          terminalReason: 'aborted_streaming',
          errors: [
            '[ede_diagnostic] result_type=user last_content_type=n/a stop_reason=null',
            'Error: Request was aborted.\n    at makeRequest',
          ],
        }),
      );
    });

    const ede = screen.getByRole('status', { name: 'err-0' });
    expect(ede.getAttribute('data-content')).toBe('ede_diagnostic');
    expect(ede.getAttribute('data-detail')).toContain('[ede_diagnostic]');

    const aborted = screen.getByRole('status', { name: 'err-1' });
    expect(aborted.getAttribute('data-content')).toBe('aborted');
    expect(aborted.getAttribute('data-detail')).toContain('Request was aborted');
  });

  it('non-aborted error keeps full message in content (no kind, no detail)', async () => {
    const { claude } = await renderWithChannel(<ErrorProbe />);

    await act(async () => {
      await claude.emitSegment(s.resultError({ errors: ['Max turns exceeded'] }));
    });

    const err = screen.getByRole('status', { name: 'err-0' });
    expect(err.getAttribute('data-content')).toBe('Max turns exceeded');
    expect(err.getAttribute('data-detail')).toBe('');
  });
});
