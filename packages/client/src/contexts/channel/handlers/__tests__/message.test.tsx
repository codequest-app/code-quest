import { segments as s } from '@code-quest/summoner/test';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SendButton } from '@/test/helpers';
import { renderWithChannel } from '@/test/render-with-channel';
import { useChannelMessages } from '../../../channel';

function MessagesProbe() {
  const { messages } = useChannelMessages();
  const userMsgs = messages.filter((m) => m.role === 'user' && m.type === 'text');
  return (
    <ul aria-label="user-messages">
      {userMsgs.map((m, i) => (
        <li
          key={m.id}
          role="status"
          aria-label={`umsg-${i}`}
          data-id={m.id}
          data-cli-uuid={m.cliUuid ?? ''}
        >
          {m.content}
        </li>
      ))}
    </ul>
  );
}

describe('message:user handler — meta.source propagation', () => {
  function SourceProbe() {
    const { messages } = useChannelMessages();
    const texts = messages.filter((m) => m.role === 'user' && m.type === 'text');
    return (
      <ul>
        {texts.map((m, i) => (
          <li
            key={m.id}
            role="status"
            aria-label={`text-${i}`}
            data-source={(m.meta as { source?: string } | undefined)?.source ?? ''}
          >
            {m.content}
          </li>
        ))}
      </ul>
    );
  }

  it('isSynthetic event sets meta.source="skill"', async () => {
    const { claude } = await renderWithChannel(<SourceProbe />);
    await act(async () => {
      await claude.emit(
        JSON.stringify({
          type: 'user',
          isSynthetic: true,
          message: {
            role: 'user',
            content: [{ type: 'text', text: '# Heading\n\n**bold**' }],
          },
        }),
      );
    });
    const el = screen.getByRole('status', { name: 'text-0' });
    expect(el.getAttribute('data-source')).toBe('skill');
  });

  it('plain user input defaults meta.source to "typed"', async () => {
    const { claude } = await renderWithChannel(<SourceProbe />);
    await act(async () => {
      await claude.emit(s.user('plain typed text'));
    });
    const el = screen.getByRole('status', { name: 'text-0' });
    expect(el.getAttribute('data-source')).toBe('typed');
  });
});

describe('message:user handler — cliUuid (fix-fork-message-uuid)', () => {
  it('CLI echo with matching content sets cliUuid; preserves local id', async () => {
    const user = userEvent.setup();
    const { claude } = await renderWithChannel(
      <>
        <SendButton message="hello-from-test" />
        <MessagesProbe />
      </>,
    );

    await user.click(screen.getByText('TriggerSend'));

    const before = screen.getByRole('status', { name: 'umsg-0' });
    const beforeId = before.getAttribute('data-id');
    expect(before.getAttribute('data-cli-uuid')).toBe('');

    await act(async () => {
      await claude.emit(s.user('hello-from-test', { uuid: 'cli-real-uuid-1' }));
    });

    const after = screen.getByRole('status', { name: 'umsg-0' });
    expect(after.getAttribute('data-id')).toBe(beforeId);
    expect(after.getAttribute('data-cli-uuid')).toBe('cli-real-uuid-1');
  });

  it('CLI echo with non-matching content appends new message with cliUuid', async () => {
    const { claude } = await renderWithChannel(<MessagesProbe />);

    await act(async () => {
      await claude.emit(s.user('orphan-echo', { uuid: 'cli-real-uuid-2' }));
    });

    const items = screen
      .getAllByRole('status')
      .filter((el) => el.getAttribute('aria-label')?.startsWith('umsg-'));
    expect(items).toHaveLength(1);
    expect(items[0].getAttribute('data-cli-uuid')).toBe('cli-real-uuid-2');
  });

  it('echo arrives after streamed assistant placeholder: dedup still finds user msg', async () => {
    const user = userEvent.setup();
    const { claude } = await renderWithChannel(
      <>
        <SendButton message="dedup-after-stream" />
        <MessagesProbe />
      </>,
    );

    await user.click(screen.getByText('TriggerSend'));
    expect(
      screen
        .getAllByRole('status')
        .filter((el) => el.getAttribute('aria-label')?.startsWith('umsg-')),
    ).toHaveLength(1);

    // Simulate streaming-induced message before the user echo arrives.
    await act(async () => {
      await claude.emit(s.streamlinedText('partial assistant…'));
    });

    // User echo arrives AFTER the assistant placeholder (NOT the last msg).
    await act(async () => {
      await claude.emit(s.user('dedup-after-stream', { uuid: 'echo-after-stream' }));
    });

    const items = screen
      .getAllByRole('status')
      .filter((el) => el.getAttribute('aria-label')?.startsWith('umsg-'));
    expect(items).toHaveLength(1);
    expect(items[0].getAttribute('data-cli-uuid')).toBe('echo-after-stream');
  });

  it('idempotent: re-emitting same uuid does not duplicate or mutate', async () => {
    const user = userEvent.setup();
    const { claude } = await renderWithChannel(
      <>
        <SendButton message="idempotent-test" />
        <MessagesProbe />
      </>,
    );

    await user.click(screen.getByText('TriggerSend'));

    await act(async () => {
      await claude.emit(s.user('idempotent-test', { uuid: 'same-uuid' }));
    });
    const idAfterFirst = screen.getByRole('status', { name: 'umsg-0' }).getAttribute('data-id');

    await act(async () => {
      await claude.emit(s.user('idempotent-test', { uuid: 'same-uuid' }));
    });

    const items = screen
      .getAllByRole('status')
      .filter((el) => el.getAttribute('aria-label')?.startsWith('umsg-'));
    expect(items).toHaveLength(1);
    expect(items[0].getAttribute('data-cli-uuid')).toBe('same-uuid');
    expect(items[0].getAttribute('data-id')).toBe(idAfterFirst);
  });
});
