import { segments as s } from '@code-quest/summoner/test';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { emitAssistantTurn, SendButton } from '../../test/helpers';
import { renderWithChannel } from '../../test/render-with-channel';
import { MessageList } from '../MessageList';

async function setup(props?: { searchQuery?: string; typeFilter?: string[] }) {
  return renderWithChannel(
    <>
      <SendButton message="Hello" />
      <MessageList {...props} />
    </>,
  );
}

/** Populate basic messages: user "Hello" + assistant "Hi there" + error "Oops" */
async function setupWithMessages(props?: { searchQuery?: string; typeFilter?: string[] }) {
  const ctx = await setup(props);
  // User message
  await userEvent.click(screen.getByText('TriggerSend'));
  // Assistant message
  await ctx.claude.emit(s.assistant('Hi there'));
  // Error result
  await ctx.claude.emit(s.resultError());
  return ctx;
}

describe('scroll button visibility via useInView', () => {
  it('hides scroll button when bottom sentinel is in view', async () => {
    await setupWithMessages();
    expect(screen.queryByTestId('scroll-to-bottom')).not.toBeInTheDocument();
  });
});

describe('MessageList', () => {
  it('renders all messages', async () => {
    await setupWithMessages();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText(/Hi there/)).toBeInTheDocument();
  });

  it('renders empty state with welcome text when no messages', async () => {
    await setup();
    expect(screen.getByText(/how can i help/i)).toBeInTheDocument();
  });

  it('renders user and assistant messages without avatar badges', async () => {
    await setupWithMessages();
    expect(screen.queryByText('You')).not.toBeInTheDocument();
    expect(screen.queryByText('Assistant')).not.toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText(/Hi there/)).toBeInTheDocument();
  });

  it('renders consecutive same-role messages without role labels', async () => {
    const { claude } = await setup();
    await claude.emit(s.assistant('First'));
    await claude.emit(
      s.assistant({ toolUse: { id: 'toolu_1', name: 'bash', input: { command: 'ls' } } }),
    );
    await claude.emit(s.assistant('Second'));
    await claude.emit(s.result());
    expect(screen.queryByText('Assistant')).not.toBeInTheDocument();
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('renders message-list container with messages', async () => {
    await setupWithMessages();
    const list = screen.getByTestId('message-list');
    expect(list).toBeInTheDocument();
    expect(list.textContent).toContain('Hello');
  });

  it('nests child messages under their parent tool_use', async () => {
    const { claude } = await setup();
    await claude.emit(s.assistant('Starting'));
    await claude.emit(s.assistant({ toolUse: { id: 'toolu_1', name: 'Agent', input: {} } }));
    await claude.emit(s.assistant('Sub output', { parentToolUseId: 'toolu_1' }));
    await claude.emit(s.assistant('Done'));
    await claude.emit(s.result());
    expect(screen.getByText('Starting')).toBeInTheDocument();
    expect(screen.getByText('Sub output')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText(/1 subagent message/)).toBeInTheDocument();
  });

  it('shows all messages when searchQuery is empty', async () => {
    await setupWithMessages({ searchQuery: '' });
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText(/Hi there/)).toBeInTheDocument();
  });

  it('filters messages by searchQuery', async () => {
    await setupWithMessages({ searchQuery: 'Hello' });
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.queryByText(/Hi there/)).not.toBeInTheDocument();
  });

  it('filters messages by typeFilter', async () => {
    const { claude } = await setup({ typeFilter: ['raw_event'] });
    await userEvent.click(screen.getByText('TriggerSend'));
    await emitAssistantTurn(claude, 'Reply');
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Reply')).toBeInTheDocument();
  });

  it('shows all messages when typeFilter is empty', async () => {
    await setupWithMessages({ typeFilter: [] });
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText(/Hi there/)).toBeInTheDocument();
  });

  it('shows correct count for multiple subagent messages', async () => {
    const { claude } = await setup();
    await claude.emit(s.assistant({ toolUse: { id: 'toolu_1', name: 'Agent', input: {} } }));
    await claude.emit(s.assistant('Child 1', { parentToolUseId: 'toolu_1' }));
    await claude.emit(s.assistant('Child 2', { parentToolUseId: 'toolu_1' }));
    await claude.emit(s.result());
    expect(screen.getByText(/2 subagent messages/)).toBeInTheDocument();
  });

  it('shows stop button in subagent header', async () => {
    const { claude } = await setup();
    await claude.emit(s.assistant({ toolUse: { id: 'toolu_1', name: 'Agent', input: {} } }));
    await claude.emit(s.assistant('Sub output', { parentToolUseId: 'toolu_1' }));
    expect(screen.getByTitle('Stop subagent')).toBeInTheDocument();
  });

  it('clicking stop subagent does not crash', async () => {
    const user = userEvent.setup();
    const { claude } = await setup();
    await claude.emit(s.assistant({ toolUse: { id: 'toolu_1', name: 'Agent', input: {} } }));
    await claude.emit(s.assistant('Child', { parentToolUseId: 'toolu_1' }));
    await user.click(screen.getByTitle('Stop subagent'));
    expect(screen.getByTitle('Stop subagent')).toBeInTheDocument();
  });

  it('renders tool_result merged into tool_use collapsible with diff', async () => {
    const user = userEvent.setup();
    const { claude } = await setup();
    await claude.emit(
      s.assistant({
        toolUse: { id: 'toolu_edit_1', name: 'Edit', input: { file_path: '/file.txt' } },
      }),
    );
    await claude.emit(
      s.toolResult('toolu_edit_1', '--- a/file.txt\n+++ b/file.txt\n@@ -1 +1 @@\n-old\n+new'),
    );
    // tool_result is merged into tool_use node by buildMessageTree
    // Expand tool_use collapsible to see the diff content
    await user.click(screen.getByText('Edit'));
    // Diff viewer renders the diff content inside the expanded tool_use
    expect(screen.getByText('-old')).toBeInTheDocument();
    expect(screen.getByText('+new')).toBeInTheDocument();
  });
});

describe('MessageList streaming', () => {
  it('shows statusText via SpinnerVerb when processing', async () => {
    const { claude } = await setup();
    await userEvent.click(screen.getByText('TriggerSend'));
    await claude.emit(s.status({ status: 'Compacting' }));
    const verb = screen.getByTestId('spinner-verb');
    expect(verb.textContent).toContain('Compacting');
  });

  it('shows random verb when statusText is null', async () => {
    await setupWithMessages();
    // After result, not processing — no spinner
    expect(screen.queryByTestId('spinner-verb')).not.toBeInTheDocument();
  });

  it('does not show spinner when not processing', async () => {
    await setup();
    expect(screen.queryByTestId('spinner-verb')).not.toBeInTheDocument();
  });

  // ── Streaming pipeline ──

  it('text_delta accumulates and renders', async () => {
    const { claude } = await setup();
    await userEvent.click(screen.getByText('TriggerSend'));
    await claude.emit(s.textDelta('Hello'));
    await claude.emit(s.textDelta(' world'));

    expect(await screen.findByText(/Hello world/)).toBeInTheDocument();
  });

  it('thinking_delta accumulates and renders', async () => {
    const { claude } = await setup();
    await userEvent.click(screen.getByText('TriggerSend'));
    await claude.emit(s.thinkingDelta('Let me'));
    await claude.emit(s.thinkingDelta(' think about this'));

    expect(await screen.findByText(/Let me think about this/)).toBeInTheDocument();
  });

  it('message_end finalizes streaming, next delta starts new message', async () => {
    const { claude } = await setup();
    await userEvent.click(screen.getByText('TriggerSend'));
    await claude.emit(s.textDelta('First message'));
    await claude.emit(s.messageStop());
    await claude.emit(s.textDelta('Second message'));
    await claude.emit(s.messageStop());
    await emitAssistantTurn(claude, 'Second message');

    expect(await screen.findByText(/First message/)).toBeInTheDocument();
    expect(screen.queryAllByText(/Second message/).length).toBeGreaterThan(0);
  });

  it('thinking_delta shows "Thinking..." while streaming', async () => {
    const { claude } = await setup();
    await userEvent.click(screen.getByText('TriggerSend'));
    await claude.emit(s.thinkingDelta('Let me'));
    await claude.emit(s.thinkingDelta(' think'));

    expect(await screen.findByText('Thinking...')).toBeInTheDocument();
  });

  it('thinking shows "Thought for Xs" after result arrives', async () => {
    const { claude } = await setup();
    await userEvent.click(screen.getByText('TriggerSend'));
    await claude.emit(s.thinkingDelta('Let me think'));
    await claude.emit(s.thinking('Let me think'));
    await claude.emit(s.assistant('answer'));
    await claude.emit(s.result({ durationMs: 3000 }));

    expect(await screen.findByText('Thought for 3s')).toBeInTheDocument();
  });

  it('thinking_delta followed by thinking does not duplicate', async () => {
    const { claude } = await setup();
    await userEvent.click(screen.getByText('TriggerSend'));
    await claude.emit(s.thinkingDelta('Let me'));
    await claude.emit(s.thinkingDelta(' think...'));
    await claude.emit(s.thinking('Let me think...'));
    await emitAssistantTurn(claude, 'ok');

    const thinkElements = screen.queryAllByText(/Let me think\.\.\./);
    expect(thinkElements).toHaveLength(1);
  });

  it('assistant replay after text_delta does not duplicate', async () => {
    const { claude } = await setup();
    await userEvent.click(screen.getByText('TriggerSend'));
    await claude.emit(s.textDelta('hello'));
    await claude.emit(s.textDelta(' world'));
    await claude.emit(s.assistant('hello world'));
    await claude.emit(s.messageStop());
    await claude.emit(s.result());

    const matches = screen.queryAllByText(/hello world/);
    expect(matches).toHaveLength(1);
  });
});
