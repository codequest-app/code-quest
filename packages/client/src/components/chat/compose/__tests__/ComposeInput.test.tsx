import { segments as s } from '@code-quest/summoner/test';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { createFakeSummoner } from '../../../../test/fake-summoner';
import { COMPOSE_PLACEHOLDER } from '../../../../test/helpers';
import { renderWithChannel } from '../../../../test/render-with-channel';
import { ComposeInput } from '../ComposeInput';

const containerRef = createRef<HTMLDivElement>();

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
    await claude.emit(s.assistant('thinking...'));

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

    it('pasting a non-image file is ignored', async () => {
      await renderWithChannel(<ComposeInput containerRef={containerRef} />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      const pdf = new File(['pdf'], 'doc.pdf', { type: 'application/pdf' });
      pasteClipboard(textarea, [{ kind: 'file', type: 'application/pdf', file: pdf }]);
      expect(screen.queryByLabelText(/^Remove /)).toBeNull();
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
  });
});
