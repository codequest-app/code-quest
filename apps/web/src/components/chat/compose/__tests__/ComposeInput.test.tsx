import { segments as s } from '@code-quest/test-kit';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFakeSummoner } from '@/test/fake-summoner';
import { COMPOSE_PLACEHOLDER } from '@/test/helpers';
import { renderWithChannel } from '@/test/render-with-channel';
import { ComposeInput } from '../ComposeInput.tsx';

const containerRef = createRef<HTMLDivElement>();

describe('ComposeInput mic padding', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('has pr-10 on textarea when SpeechRecognition is supported', async () => {
    vi.stubGlobal('SpeechRecognition', class {});
    await renderWithChannel(<ComposeInput containerRef={containerRef} />);
    const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
    expect(textarea.className).toContain('pr-10');
    expect(textarea.className).not.toContain('pr-3.5');
  });

  it('has pr-3.5 on textarea when SpeechRecognition is not supported', async () => {
    // vi.stubGlobal sets to undefined but keeps the key; delete removes it from `in` checks
    delete (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition;
    delete (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    await renderWithChannel(<ComposeInput containerRef={containerRef} />);
    const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
    expect(textarea.className).toContain('pr-3.5');
    expect(textarea.className).not.toContain('pr-10');
  });
});

describe('ComposeInput', () => {
  it('renders textarea with placeholder', async () => {
    await renderWithChannel(<ComposeInput containerRef={containerRef} />);
    expect(screen.getByPlaceholderText(COMPOSE_PLACEHOLDER)).toBeInTheDocument();
  });

  it('typing updates the textarea value', async () => {
    await renderWithChannel(<ComposeInput containerRef={containerRef} />);
    const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
    await userEvent.type(textarea, 'hello');
    expect(textarea).toHaveValue('hello');
  });

  it('shows processing placeholder when status is processing', async () => {
    const { claude } = await renderWithChannel(<ComposeInput containerRef={containerRef} />);
    // Send message without result → status becomes processing
    const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
    await userEvent.type(textarea, 'go');
    await userEvent.keyboard('{Enter}');
    await claude.emitSegment(s.assistant('thinking...'));

    expect(screen.getByPlaceholderText('Queue another message…')).toBeInTheDocument();
  });

  it('Enter submits and clears textarea', async () => {
    await renderWithChannel(<ComposeInput containerRef={containerRef} />);
    const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
    await userEvent.type(textarea, 'hello{Enter}');
    expect(textarea).toHaveValue('');
  });

  it('textarea height resets after submit (CSS grid trick auto-sizes via hidden mirror)', async () => {
    await renderWithChannel(<ComposeInput containerRef={containerRef} />);
    const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER) as HTMLTextAreaElement;

    await userEvent.type(textarea, 'line1\nline2\nline3');
    expect(textarea).toHaveValue('line1\nline2\nline3');

    await userEvent.keyboard('{Enter}');

    // After submit, value is cleared → mirror div shrinks → textarea shrinks
    expect(textarea).toHaveValue('');
  });

  it('renders without error when no attachments', async () => {
    await renderWithChannel(<ComposeInput containerRef={containerRef} />);
    expect(screen.getByPlaceholderText(COMPOSE_PLACEHOLDER)).toBeInTheDocument();
  });

  describe('paste image', () => {
    function pasteClipboard(
      target: Element,
      items: { kind: string; type: string; file?: File }[],
    ): void {
      const clipboardData = {
        items: items.map((i) => ({
          kind: i.kind,
          type: i.type,
          getAsFile: () => i.file ?? null,
        })),
      };
      fireEvent.paste(target, { clipboardData });
    }

    it('pasting an image attaches it and leaves textarea empty', async () => {
      await renderWithChannel(<ComposeInput containerRef={containerRef} />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      const img = new File(['fake-bytes'], 'screenshot.png', { type: 'image/png' });
      pasteClipboard(textarea, [{ kind: 'file', type: 'image/png', file: img }]);
      expect(await screen.findByLabelText('Remove screenshot.png')).toBeInTheDocument();
      expect(textarea).toHaveValue('');
    });

    it('pasting multiple images attaches all in order', async () => {
      await renderWithChannel(<ComposeInput containerRef={containerRef} />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      const a = new File(['a'], 'a.png', { type: 'image/png' });
      const b = new File(['b'], 'b.jpg', { type: 'image/jpeg' });
      pasteClipboard(textarea, [
        { kind: 'file', type: 'image/png', file: a },
        { kind: 'file', type: 'image/jpeg', file: b },
      ]);
      expect(await screen.findByLabelText('Remove a.png')).toBeInTheDocument();
      expect(screen.getByLabelText('Remove b.jpg')).toBeInTheDocument();
    });

    it('pasting plain text does not create an attachment', async () => {
      await renderWithChannel(<ComposeInput containerRef={containerRef} />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      pasteClipboard(textarea, [{ kind: 'string', type: 'text/plain' }]);
      expect(screen.queryByLabelText(/^Remove /)).toBeNull();
    });

    it('pasting an image shows a thumbnail <img> instead of filename chip', async () => {
      vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:fake'), revokeObjectURL: vi.fn() });
      await renderWithChannel(<ComposeInput containerRef={containerRef} />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      const img = new File(['bytes'], 'photo.png', { type: 'image/png' });
      pasteClipboard(textarea, [{ kind: 'file', type: 'image/png', file: img }]);
      const thumb = await screen.findByRole('img', { name: 'photo.png' });
      expect(thumb).toHaveAttribute('src', 'blob:fake');
    });

    it('clicking the image thumbnail opens preview modal', async () => {
      vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:fake'), revokeObjectURL: vi.fn() });
      await renderWithChannel(<ComposeInput containerRef={containerRef} />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      const img = new File(['bytes'], 'photo.png', { type: 'image/png' });
      pasteClipboard(textarea, [{ kind: 'file', type: 'image/png', file: img }]);
      const thumb = await screen.findByRole('img', { name: 'photo.png' });
      await userEvent.click(thumb);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('pasting a non-image file is ignored', async () => {
      await renderWithChannel(<ComposeInput containerRef={containerRef} />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      const pdf = new File(['pdf'], 'doc.pdf', { type: 'application/pdf' });
      pasteClipboard(textarea, [{ kind: 'file', type: 'application/pdf', file: pdf }]);
      expect(screen.queryByLabelText(/^Remove /)).toBeNull();
    });
  });

  describe('input history', () => {
    it('ArrowUp on single-line input shows previous submitted message', async () => {
      await renderWithChannel(<ComposeInput containerRef={containerRef} />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER) as HTMLTextAreaElement;

      await userEvent.type(textarea, 'hello{Enter}');
      await userEvent.keyboard('{ArrowUp}');

      expect(textarea).toHaveValue('hello');
    });

    it('ArrowUp on multiline input when cursor is NOT on first line does not change value', async () => {
      await renderWithChannel(<ComposeInput containerRef={containerRef} />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER) as HTMLTextAreaElement;

      // Submit a message so history is non-empty
      await userEvent.type(textarea, 'first{Enter}');

      // Type multiline content using Shift+Enter (inserts newline, does not submit)
      await userEvent.type(textarea, 'line1');
      await userEvent.keyboard('{Shift>}{Enter}{/Shift}');
      await userEvent.type(textarea, 'line2');
      await userEvent.keyboard('{Shift>}{Enter}{/Shift}');
      await userEvent.type(textarea, 'line3');

      // cursor is at end of "line3" — not on first line
      expect(textarea.selectionStart).toBeGreaterThan(textarea.value.indexOf('\n'));

      const valueBefore = textarea.value;
      await userEvent.keyboard('{ArrowUp}');

      expect(textarea).toHaveValue(valueBefore);
    });

    it('ArrowDown after ArrowUp restores the draft input', async () => {
      await renderWithChannel(<ComposeInput containerRef={containerRef} />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER) as HTMLTextAreaElement;

      await userEvent.type(textarea, 'hello{Enter}');
      await userEvent.type(textarea, 'draft text');
      await userEvent.keyboard('{ArrowUp}');
      expect(textarea).toHaveValue('hello');

      await userEvent.keyboard('{ArrowDown}');
      expect(textarea).toHaveValue('draft text');
    });

    it('ArrowDown after ArrowUp returns to empty when input was empty', async () => {
      await renderWithChannel(<ComposeInput containerRef={containerRef} />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER) as HTMLTextAreaElement;

      await userEvent.type(textarea, 'hello{Enter}');
      await userEvent.keyboard('{ArrowUp}');
      expect(textarea).toHaveValue('hello');

      await userEvent.keyboard('{ArrowDown}');
      expect(textarea).toHaveValue('');
    });

    it('does not include skill-injected messages (isSynthetic) in ArrowUp history', async () => {
      const { claude } = await renderWithChannel(<ComposeInput containerRef={containerRef} />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER) as HTMLTextAreaElement;

      await act(async () => {
        await claude.emitSegment(
          s.skill('Base directory for this skill: /some/path\n\n# Skill Content'),
        );
      });

      await userEvent.click(textarea);
      await userEvent.keyboard('{ArrowUp}');
      expect(textarea).toHaveValue('');
    });

    it('does not include loop-wakeup messages (parent_tool_use_id) in ArrowUp history', async () => {
      const { claude } = await renderWithChannel(<ComposeInput containerRef={containerRef} />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER) as HTMLTextAreaElement;

      await act(async () => {
        await claude.emitSegment(s.user('wake up prompt', { parentToolUseId: 'toolu_loop123' }));
      });

      await userEvent.click(textarea);
      await userEvent.keyboard('{ArrowUp}');
      expect(textarea).toHaveValue('');
    });

    it('only includes messages with history=true in ArrowUp history', async () => {
      const user = userEvent.setup();
      const { claude } = await renderWithChannel(<ComposeInput containerRef={containerRef} />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER) as HTMLTextAreaElement;

      await userEvent.type(textarea, 'user typed this');
      await user.keyboard('{Enter}');

      await act(async () => {
        await claude.emitSegment(s.user('loop injected', { parentToolUseId: 'toolu_loop456' }));
      });

      await userEvent.click(textarea);
      await userEvent.keyboard('{ArrowUp}');
      expect(textarea).toHaveValue('user typed this');
    });

    it('history arrives in later batch is still reachable via ArrowUp', async () => {
      const { claude } = await renderWithChannel(<ComposeInput containerRef={containerRef} />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER) as HTMLTextAreaElement;

      // First batch: a plain user message (history:true) but not the target
      await act(async () => {
        await claude.emitSegment(s.user('first batch message'));
      });

      // Second batch: target message arrives later
      await act(async () => {
        await claude.emitSegment(s.user('再5輪'));
      });

      await userEvent.click(textarea);
      await userEvent.keyboard('{ArrowUp}');
      expect(textarea).toHaveValue('再5輪');
    });

    it('ArrowUp moves cursor to start of input', async () => {
      await renderWithChannel(<ComposeInput containerRef={containerRef} />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER) as HTMLTextAreaElement;

      await userEvent.type(textarea, 'hello{Enter}');
      await userEvent.keyboard('{ArrowUp}');

      expect(textarea).toHaveValue('hello');
      expect(textarea.selectionStart).toBe(0);
      expect(textarea.selectionEnd).toBe(0);
    });
  });

  describe('@ mention', () => {
    it('typing @ opens mention dropdown with file results', async () => {
      await renderWithChannel(<ComposeInput containerRef={containerRef} />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      await userEvent.type(textarea, '@');

      await waitFor(() => {
        expect(screen.getByLabelText('mention-dropdown')).toBeInTheDocument();
      });
    });

    it('typing @src/ lists directory contents', async () => {
      await renderWithChannel(<ComposeInput containerRef={containerRef} />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      await userEvent.type(textarea, '@src/');

      await waitFor(() => {
        expect(screen.getByLabelText('mention-dropdown')).toBeInTheDocument();
      });
    });

    it('Escape closes mention dropdown', async () => {
      await renderWithChannel(<ComposeInput containerRef={containerRef} />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      await userEvent.type(textarea, '@');

      await waitFor(() => {
        expect(screen.getByLabelText('mention-dropdown')).toBeInTheDocument();
      });

      await userEvent.keyboard('{Escape}');
      expect(screen.queryByLabelText('mention-dropdown')).not.toBeInTheDocument();
    });

    it('active file result item uses bg-selected class', async () => {
      const summoner = createFakeSummoner();
      const cwd = '/test/project';
      summoner.filesystem().setRoots([cwd]);
      summoner.filesystem().addFile(`${cwd}/index.ts`, '');
      await renderWithChannel(<ComposeInput containerRef={containerRef} />, { summoner, cwd });

      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      await userEvent.type(textarea, '@index');

      await waitFor(() => {
        expect(screen.getByRole('option')).toBeInTheDocument();
      });

      await userEvent.keyboard('{ArrowDown}');

      const option = screen.getByRole('option');
      expect(option.className).toContain('bg-selected');
    });

    it('selecting a file inserts @path and closes dropdown', async () => {
      const summoner = createFakeSummoner();
      const cwd = '/test/project';
      summoner.filesystem().setRoots([cwd]);
      // Seed files at the channel's resolved cwd
      summoner.filesystem().addFile(`${cwd}/index.ts`, '');
      await renderWithChannel(<ComposeInput containerRef={containerRef} />, { summoner, cwd });

      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      await userEvent.type(textarea, '@index');

      await waitFor(() => {
        expect(screen.getByLabelText('mention-dropdown')).toBeInTheDocument();
      });

      const option = screen.getByRole('option');
      await userEvent.click(option);

      expect(screen.queryByLabelText('mention-dropdown')).not.toBeInTheDocument();
      expect((textarea as HTMLTextAreaElement).value).toContain('@');
    });

    it('ArrowUp at first item wraps to last item', async () => {
      const summoner = createFakeSummoner();
      const cwd = '/test/project';
      summoner.filesystem().setRoots([cwd]);
      summoner.filesystem().addFile(`${cwd}/a.ts`, '');
      summoner.filesystem().addFile(`${cwd}/b.ts`, '');
      summoner.filesystem().addFile(`${cwd}/c.ts`, '');
      await renderWithChannel(<ComposeInput containerRef={containerRef} />, { summoner, cwd });

      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      await userEvent.type(textarea, '@');

      await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(3));

      // Go to first item, then ArrowUp should wrap to last
      await userEvent.keyboard('{ArrowDown}'); // index 0
      await userEvent.keyboard('{ArrowUp}'); // should wrap to last (index 2)

      const options = screen.getAllByRole('option');
      expect(options[2]!.className).toContain('bg-selected');
    });

    it('ArrowDown at last item wraps to first item', async () => {
      const summoner = createFakeSummoner();
      const cwd = '/test/project';
      summoner.filesystem().setRoots([cwd]);
      summoner.filesystem().addFile(`${cwd}/a.ts`, '');
      summoner.filesystem().addFile(`${cwd}/b.ts`, '');
      summoner.filesystem().addFile(`${cwd}/c.ts`, '');
      await renderWithChannel(<ComposeInput containerRef={containerRef} />, { summoner, cwd });

      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      await userEvent.type(textarea, '@');

      await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(3));

      // Go to last item, then ArrowDown should wrap to first
      await userEvent.keyboard('{ArrowDown}'); // 0
      await userEvent.keyboard('{ArrowDown}'); // 1
      await userEvent.keyboard('{ArrowDown}'); // 2 (last)
      await userEvent.keyboard('{ArrowDown}'); // should wrap to 0

      const options = screen.getAllByRole('option');
      expect(options[0]!.className).toContain('bg-selected');
    });

    it('directories appear before files in results', async () => {
      const summoner = createFakeSummoner();
      const cwd = '/test/project';
      summoner.filesystem().setRoots([cwd]);
      summoner.filesystem().addFile(`${cwd}/z-file.ts`, '');
      summoner.filesystem().addFile(`${cwd}/m-file.ts`, '');
      summoner.filesystem().addDirectory(cwd, ['a-dir', 'b-dir']);
      await renderWithChannel(<ComposeInput containerRef={containerRef} />, { summoner, cwd });

      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      await userEvent.type(textarea, '@');

      await waitFor(() => expect(screen.getAllByRole('option').length).toBeGreaterThanOrEqual(4));

      const options = screen.getAllByRole('option');
      const labels = options.map((o) => o.textContent ?? '');

      const firstFileIndex = labels.findIndex((l) => l.includes('.ts'));
      const lastDirIndex = labels.map((l) => l.includes('-dir')).lastIndexOf(true);
      expect(lastDirIndex).toBeLessThan(firstFileIndex);
    });
  });
});
