import { segments as s } from '@code-quest/summoner/test';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import {
  type GroupId,
  useMessageVisibility,
} from '../../../../contexts/channel/MessageVisibilityContext';
import { createFakeSummoner } from '../../../../test/fake-summoner';
import { emitAssistantTurn, SendButton } from '../../../../test/helpers';
import { renderWithChannel } from '../../../../test/render-with-channel';
import { MessageList, type MessageListHandle } from '../MessageList';

// Helper: toggle a group via the context from inside a rendered component
function ToggleGroup({ group }: { group: GroupId }) {
  const { toggleGroup } = useMessageVisibility();
  return (
    <button type="button" onClick={() => toggleGroup(group)}>
      toggle-{group}
    </button>
  );
}

async function setup(props?: { searchQuery?: string }) {
  const summoner = createFakeSummoner();
  const claude = summoner.claude();
  const channelId = crypto.randomUUID();

  // Pre-create session on server so session:join succeeds during render
  await claude.initialize({ launch: { channelId } }, s.init('cli-session'));

  return renderWithChannel(
    <>
      <SendButton message="Hello" />
      <MessageList {...props} />
    </>,
    { summoner, channelId, skipInit: true },
  );
}

/** Populate basic messages: user "Hello" + assistant "Hi there" + error "Oops" */
async function setupWithMessages(props?: { searchQuery?: string }) {
  const ctx = await setup(props);
  // User message
  await userEvent.click(screen.getByText('TriggerSend'));
  // Assistant message
  await act(async () => {
    await ctx.claude.emit(s.assistant('Hi there'));
    await ctx.claude.emit(s.resultError());
  });
  return ctx;
}

describe('scroll button visibility', () => {
  it('hides scroll button when not scrolled up', async () => {
    await setupWithMessages();
    expect(screen.queryByRole('button', { name: 'Scroll to bottom' })).not.toBeInTheDocument();
  });

  it('scroll-to-bottom button is outside the scroll container (not inside overflow-y-auto)', async () => {
    await setupWithMessages();
    // Force show the button by simulating scroll state
    // The button should be a sibling of (or ancestor of) the scroll container,
    // not a descendant of it
    const messageList = screen.getByLabelText('message-list');
    const scrollContainer = screen.getByLabelText('message-list-scroll');
    // message-list is the outer positioning parent
    // message-list-scroll is the inner scroll container
    // button should NOT be inside message-list-scroll
    expect(messageList).toBeInTheDocument();
    expect(scrollContainer).toBeInTheDocument();
    expect(messageList).toContainElement(scrollContainer);
    // scroll container should NOT contain the button (button is sibling)
    expect(scrollContainer).not.toContainElement(
      scrollContainer.querySelector('[aria-label="Scroll to bottom"]'),
    );
  });
});

describe('MessageList', () => {
  it('renders all messages', async () => {
    await setupWithMessages();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText(/Hi there/)).toBeInTheDocument();
  });

  it('renders unknown type messages (registers type so message passes visibility filter)', async () => {
    const { useChannelMessagesActions } = await import(
      '../../../../contexts/channel/ChannelMessagesContext'
    );
    function AddUnknown() {
      const { addSystemMessage } = useChannelMessagesActions();
      return (
        <button
          type="button"
          onClick={() => addSystemMessage('future_event_xyz', 'custom content')}
        >
          add-unknown
        </button>
      );
    }
    const summoner = (await import('../../../../test/fake-summoner')).createFakeSummoner();
    const claude = summoner.claude();
    const channelId = crypto.randomUUID();
    const { renderWithChannel: rwc } = await import('../../../../test/render-with-channel');
    await claude.initialize({ launch: { channelId } }, s.init('cli-session'));
    await rwc(
      <>
        <AddUnknown />
        <MessageList />
      </>,
      { summoner, channelId, skipInit: true },
    );
    await userEvent.click(screen.getByText('add-unknown'));
    expect(screen.getByText('custom content')).toBeInTheDocument();
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
    await act(async () => {
      await claude.emit(s.assistant('First'));
      await claude.emit(
        s.assistant({ toolUse: { id: 'toolu_1', name: 'bash', input: { command: 'ls' } } }),
      );
      await claude.emit(s.assistant('Second'));
      await claude.emit(s.result());
    });
    expect(screen.queryByText('Assistant')).not.toBeInTheDocument();
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('renders message-list container with messages', async () => {
    await setupWithMessages();
    const list = screen.getByLabelText('message-list');
    expect(list).toBeInTheDocument();
    expect(list.textContent).toContain('Hello');
  });

  it('nests child messages under their parent tool_use', async () => {
    const user = userEvent.setup();
    const { claude } = await setup();
    await act(async () => {
      await claude.emit(s.assistant('Starting'));
      await claude.emit(s.assistant({ toolUse: { id: 'toolu_1', name: 'Agent', input: {} } }));
      await claude.emit(s.assistant('Sub output', { parentToolUseId: 'toolu_1' }));
      await claude.emit(s.assistant('Done'));
      await claude.emit(s.result());
    });
    expect(screen.getByText('Starting')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    // Agent tool_use is in a collapsed group — expand it first
    await user.click(screen.getByText('Agent'));
    expect(screen.getByText('Sub output')).toBeInTheDocument();
    expect(screen.getByText(/1 subagent message/)).toBeInTheDocument();
  });

  it('groups consecutive tool_use from separate turns into one chip', async () => {
    const { claude } = await setup();
    await act(async () => {
      await claude.emit(
        s.assistant({ toolUse: { id: 'tu1', name: 'Bash', input: { command: 'ls' } } }),
      );
      await claude.emit(s.toolResult('tu1', 'file1.ts'));
      await claude.emit(
        s.assistant({ toolUse: { id: 'tu2', name: 'Bash', input: { command: 'pwd' } } }),
      );
      await claude.emit(s.toolResult('tu2', '/src'));
      await claude.emit(
        s.assistant({ toolUse: { id: 'tu3', name: 'Bash', input: { command: 'cat' } } }),
      );
      await claude.emit(s.toolResult('tu3', 'content'));
      await claude.emit(s.result());
    });
    // should show ONE chip "Bash ×3", not three separate chips
    expect(screen.getByText('Bash')).toBeInTheDocument();
    expect(screen.getByText('×3')).toBeInTheDocument();
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

  it('shows correct count for multiple subagent messages', async () => {
    const user = userEvent.setup();
    const { claude } = await setup();
    await act(async () => {
      await claude.emit(s.assistant({ toolUse: { id: 'toolu_1', name: 'Agent', input: {} } }));
      await claude.emit(s.assistant('Child 1', { parentToolUseId: 'toolu_1' }));
      await claude.emit(s.assistant('Child 2', { parentToolUseId: 'toolu_1' }));
      await claude.emit(s.result());
    });
    // Agent tool_use is in a collapsed group — expand it first
    await user.click(screen.getByText('Agent'));
    expect(screen.getByText(/2 subagent messages/)).toBeInTheDocument();
  });

  it('shows stop button in subagent header', async () => {
    const user = userEvent.setup();
    const { claude } = await setup();
    await act(async () => {
      await claude.emit(s.assistant({ toolUse: { id: 'toolu_1', name: 'Agent', input: {} } }));
      await claude.emit(s.assistant('Sub output', { parentToolUseId: 'toolu_1' }));
    });
    // Expand the collapsed group to see subagent content
    await user.click(screen.getByText('Agent'));
    expect(screen.getByTitle('Stop subagent')).toBeInTheDocument();
  });

  it('clicking stop subagent does not crash', async () => {
    const user = userEvent.setup();
    const { claude } = await setup();
    await act(async () => {
      await claude.emit(s.assistant({ toolUse: { id: 'toolu_1', name: 'Agent', input: {} } }));
      await claude.emit(s.assistant('Child', { parentToolUseId: 'toolu_1' }));
    });
    await user.click(screen.getByText('Agent'));
    await user.click(screen.getByTitle('Stop subagent'));
    expect(screen.getByTitle('Stop subagent')).toBeInTheDocument();
  });

  it('renders Read tool_result array content as code (not "[object Object]")', async () => {
    const user = userEvent.setup();
    const { claude } = await setup();
    // Build a raw tool_result segment with array content (as real extension sends)
    const arrayToolResult = JSON.stringify({
      type: 'user',
      message: {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_read_1',
            content: [
              { type: 'text', text: 'import React from "react";\nexport function Foo() {}' },
            ],
          },
        ],
      },
      parent_tool_use_id: null,
      uuid: 'fake-read-result-1',
    });
    await act(async () => {
      await claude.emit(
        s.assistant({
          toolUse: { id: 'toolu_read_1', name: 'Read', input: { file_path: '/Foo.tsx' } },
        }),
      );
      await claude.emit(arrayToolResult);
    });
    // Single tool_use renders directly; click expands the CollapsibleBlock
    await user.click(screen.getByText('Read'));
    expect(screen.queryByText('[object Object]')).not.toBeInTheDocument();
    // SyntaxHighlighter splits tokens — check via container textContent
    expect(document.body.textContent).toContain('import');
    expect(document.body.textContent).toContain('React');
  });

  it('hidden tool_use (TodoWrite in debug group, off by default) also hides its merged tool_result', async () => {
    const user = userEvent.setup();
    const { claude } = await setup();
    await act(async () => {
      await claude.emit(
        s.assistant({ toolUse: { id: 'toolu_todo_1', name: 'TodoWrite', input: { todos: [] } } }),
      );
      await claude.emit(
        s.toolResult(
          'toolu_todo_1',
          'Todos have been modified successfully. Ensure that you continue to use the todo list to track your progress.',
        ),
      );
    });
    // Debug group (tool_use:TodoWrite) is off by default.
    // The TodoWrite block itself must not render; there must be no orphan
    // "Result" collapsible left behind that exposes its merged content.
    expect(screen.queryByText('TodoWrite')).not.toBeInTheDocument();
    const resultButtons = screen
      .queryAllByRole('button')
      .filter((el) => el.textContent?.startsWith('✓'));
    expect(resultButtons).toHaveLength(0);
    // Even when a stray Result button exists, the merged body stays hidden —
    // guard against someone re-expanding via click exposing the text.
    const maybeResult = screen.queryByText('Result');
    if (maybeResult) await user.click(maybeResult);
    expect(screen.queryByText(/Todos have been modified successfully/)).not.toBeInTheDocument();
  });

  it('visible tool_use still merges its tool_result (regression)', async () => {
    const user = userEvent.setup();
    const { claude } = await setup();
    await act(async () => {
      await claude.emit(
        s.assistant({ toolUse: { id: 'toolu_grep_1', name: 'Grep', input: { pattern: 'foo' } } }),
      );
      await claude.emit(s.toolResult('toolu_grep_1', 'match found'));
    });
    // Single tool_use renders directly; click expands the CollapsibleBlock
    await user.click(screen.getByText('Grep'));
    expect(screen.getByText(/match found/)).toBeInTheDocument();
  });

  it('renders tool_result merged into tool_use collapsible with diff', async () => {
    const user = userEvent.setup();
    const { claude } = await setup();
    await act(async () => {
      await claude.emit(
        s.assistant({
          toolUse: { id: 'toolu_edit_1', name: 'Edit', input: { file_path: '/file.txt' } },
        }),
      );
      await claude.emit(
        s.toolResult('toolu_edit_1', '--- a/file.txt\n+++ b/file.txt\n@@ -1 +1 @@\n-old\n+new'),
      );
    });
    // Single tool_use renders directly; click expands the CollapsibleBlock
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
    await act(async () => {
      await claude.emit(s.status({ status: 'Compacting' }));
    });
    const verb = screen.getByLabelText('spinner-verb');
    expect(verb.textContent).toContain('Compacting');
  });

  it('shows random verb when statusText is null', async () => {
    await setupWithMessages();
    // After result, not processing — no spinner
    expect(screen.queryByLabelText('spinner-verb')).not.toBeInTheDocument();
  });

  it('does not show spinner when not processing', async () => {
    await setup();
    expect(screen.queryByLabelText('spinner-verb')).not.toBeInTheDocument();
  });

  // ── Streaming pipeline ──

  it('text_delta accumulates and renders', async () => {
    const { claude } = await setup();
    await userEvent.click(screen.getByText('TriggerSend'));
    await act(async () => {
      await claude.emit(s.textDelta('Hello'));
      await claude.emit(s.textDelta(' world'));
    });

    expect(await screen.findByText(/Hello world/)).toBeInTheDocument();
  });

  it('thinking_delta accumulates and renders', async () => {
    const { claude } = await setup();
    await userEvent.click(screen.getByText('TriggerSend'));
    await act(async () => {
      await claude.emit(s.thinkingDelta('Let me'));
      await claude.emit(s.thinkingDelta(' think about this'));
    });

    expect(await screen.findByText(/Let me think about this/)).toBeInTheDocument();
  });

  it('message_end finalizes streaming, next delta starts new message', async () => {
    const { claude } = await setup();
    await userEvent.click(screen.getByText('TriggerSend'));
    await act(async () => {
      await claude.emit(s.textDelta('First message'));
      await claude.emit(s.messageStop());
      await claude.emit(s.textDelta('Second message'));
      await claude.emit(s.messageStop());
    });
    await emitAssistantTurn(claude, 'Second message');

    expect(await screen.findByText(/First message/)).toBeInTheDocument();
    expect(screen.queryAllByText(/Second message/).length).toBeGreaterThan(0);
  });

  it('thinking_delta shows "Thinking..." while streaming', async () => {
    const { claude } = await setup();
    await userEvent.click(screen.getByText('TriggerSend'));
    await act(async () => {
      await claude.emit(s.thinkingDelta('Let me'));
      await claude.emit(s.thinkingDelta(' think'));
    });

    expect(await screen.findByText('Thinking...')).toBeInTheDocument();
  });

  it('thinking shows "Thought for Xs" after result arrives', async () => {
    const { claude } = await setup();
    await userEvent.click(screen.getByText('TriggerSend'));
    await act(async () => {
      await claude.emit(s.thinkingDelta('Let me think'));
      await claude.emit(s.thinking('Let me think'));
      await claude.emit(s.assistant('answer'));
      await claude.emit(s.result({ durationMs: 3000 }));
    });

    expect(await screen.findByText('Thought for 3s')).toBeInTheDocument();
  });

  it('thinking_delta followed by thinking does not duplicate', async () => {
    const { claude } = await setup();
    await userEvent.click(screen.getByText('TriggerSend'));
    await act(async () => {
      await claude.emit(s.thinkingDelta('Let me'));
      await claude.emit(s.thinkingDelta(' think...'));
      await claude.emit(s.thinking('Let me think...'));
    });
    await emitAssistantTurn(claude, 'ok');

    const thinkElements = screen.queryAllByText(/Let me think\.\.\./);
    expect(thinkElements).toHaveLength(1);
  });

  it('assistant replay after text_delta does not duplicate', async () => {
    const { claude } = await setup();
    await userEvent.click(screen.getByText('TriggerSend'));
    await act(async () => {
      await claude.emit(s.textDelta('hello'));
      await claude.emit(s.textDelta(' world'));
      await claude.emit(s.assistant('hello world'));
      await claude.emit(s.messageStop());
      await claude.emit(s.result());
    });

    const matches = screen.queryAllByText(/hello world/);
    expect(matches).toHaveLength(1);
  });
});

describe('MessageList scrollToMessage highlight', () => {
  async function setupWithRef() {
    const summoner = createFakeSummoner();
    const claude = summoner.claude();
    const channelId = crypto.randomUUID();
    await claude.initialize({ launch: { channelId } }, s.init('cli-session'));
    const ref = createRef<MessageListHandle>();
    const ctx = await renderWithChannel(<MessageList ref={ref} />, {
      summoner,
      channelId,
      skipInit: true,
    });
    await act(async () => {
      await claude.emit(s.assistant('Target message'));
      await claude.emit(s.result());
    });
    return { ...ctx, ref };
  }

  it('adds spotlight-highlight on [data-type] element (not the outer wrapper)', async () => {
    const { ref } = await setupWithRef();
    const wrapper = document.querySelector('[data-message-id]') as HTMLElement;
    const messageEl = wrapper?.querySelector('[data-type]') as HTMLElement;
    expect(wrapper).toBeTruthy();
    expect(messageEl).toBeTruthy();

    act(() => {
      ref.current?.scrollToMessage(wrapper.dataset.messageId!);
    });

    expect(messageEl.classList.contains('spotlight-highlight')).toBe(true);
    expect(wrapper.classList.contains('spotlight-highlight')).toBe(false);
  });

  it('removes spotlight-highlight after animationend fires', async () => {
    const { ref } = await setupWithRef();
    const wrapper = document.querySelector('[data-message-id]') as HTMLElement;
    const messageEl = wrapper?.querySelector('[data-type]') as HTMLElement;

    act(() => {
      ref.current?.scrollToMessage(wrapper.dataset.messageId!);
    });
    expect(messageEl.classList.contains('spotlight-highlight')).toBe(true);

    act(() => {
      messageEl.dispatchEvent(new Event('animationend', { bubbles: false }));
    });
    expect(messageEl.classList.contains('spotlight-highlight')).toBe(false);
  });

  it('re-triggers animation when called twice on the same message', async () => {
    const { ref } = await setupWithRef();
    const wrapper = document.querySelector('[data-message-id]') as HTMLElement;
    const messageEl = wrapper?.querySelector('[data-type]') as HTMLElement;

    act(() => {
      ref.current?.scrollToMessage(wrapper.dataset.messageId!);
    });
    act(() => {
      messageEl.dispatchEvent(new Event('animationend', { bubbles: false }));
    });
    // class removed; call again
    act(() => {
      ref.current?.scrollToMessage(wrapper.dataset.messageId!);
    });
    expect(messageEl.classList.contains('spotlight-highlight')).toBe(true);
  });
});

describe('MessageList visibility filtering', () => {
  it('hides messages in hidden groups (hooks off by default)', async () => {
    const { claude } = await renderWithChannel(<MessageList />);
    await act(async () => {
      await claude.emit(s.hookStarted('hook-1', 'my-hook', 'pre_tool_use'));
      await claude.emit(s.result());
    });
    // hook_started is in Hooks group which is off by default
    expect(screen.queryByText(/hook-1/i)).not.toBeInTheDocument();
  });

  it('shows messages in visible groups (conversation on by default)', async () => {
    const { claude } = await renderWithChannel(<MessageList />);
    await act(async () => {
      await claude.emit(s.assistant('Hello from assistant'));
      await claude.emit(s.result());
    });
    expect(screen.getByText(/Hello from assistant/)).toBeInTheDocument();
  });

  it('toggleGroup off hides messages of that group', async () => {
    const user = userEvent.setup();
    const { claude } = await renderWithChannel(
      <>
        <ToggleGroup group="conversation" />
        <MessageList />
      </>,
    );
    await act(async () => {
      await claude.emit(s.assistant('Visible text'));
      await claude.emit(s.result());
    });
    expect(screen.getByText(/Visible text/)).toBeInTheDocument();

    await user.click(screen.getByText('toggle-conversation'));
    expect(screen.queryByText(/Visible text/)).not.toBeInTheDocument();
  });

  it('toggleGroup on shows previously hidden messages', async () => {
    const user = userEvent.setup();
    const { claude } = await renderWithChannel(
      <>
        <ToggleGroup group="hooks" />
        <MessageList />
      </>,
    );
    await act(async () => {
      await claude.emit(s.hookStarted('hook-id-2', 'my-hook', 'pre_tool_use'));
      await claude.emit(s.result());
    });
    // hooks off by default — hook message count should be 0 in rendered list
    const listBefore = screen.getByLabelText('message-list');
    const hookBefore = listBefore.querySelectorAll('[data-type="hook_started"]');
    expect(hookBefore).toHaveLength(0);

    // turn hooks on
    await user.click(screen.getByText('toggle-hooks'));
    const listAfter = screen.getByLabelText('message-list');
    const hookAfter = listAfter.querySelectorAll('[data-type="hook_started"]');
    expect(hookAfter.length).toBeGreaterThan(0);
  });
});

describe('MessageList — layout', () => {
  it('message content wrapper is present', async () => {
    await setupWithMessages();
    const wrapper = document.querySelector('[aria-label="message-content-wrapper"]');
    expect(wrapper).not.toBeNull();
  });

  it('message content wrapper has pb-32 so last message scrolls above absolute InputArea', async () => {
    await setupWithMessages();
    const wrapper = document.querySelector('[aria-label="message-content-wrapper"]');
    expect(wrapper?.className).toContain('pb-32');
  });
});
