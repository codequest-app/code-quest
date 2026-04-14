import { segments as s } from '@code-quest/summoner/test';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createFakeSummoner } from '../../test/fake-summoner';
import { COMPOSE_PLACEHOLDER } from '../../test/helpers';
import { renderWithChannel } from '../../test/render-with-channel';
import { ComposeInput } from '../ComposeInput';

describe('ComposeInput', () => {
  it('renders textarea with placeholder', async () => {
    await renderWithChannel(<ComposeInput />);
    expect(screen.getByPlaceholderText(COMPOSE_PLACEHOLDER)).toBeInTheDocument();
  });

  it('typing updates the textarea value', async () => {
    await renderWithChannel(<ComposeInput />);
    const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
    await userEvent.type(textarea, 'hello');
    expect(textarea).toHaveValue('hello');
  });

  it('shows processing placeholder when status is processing', async () => {
    const { claude } = await renderWithChannel(<ComposeInput />);
    // Send message without result → status becomes processing
    const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
    await userEvent.type(textarea, 'go');
    await userEvent.keyboard('{Enter}');
    await claude.emit(s.assistant('thinking...'));

    expect(screen.getByPlaceholderText('Queue another message…')).toBeInTheDocument();
  });

  it('Enter submits and clears textarea', async () => {
    await renderWithChannel(<ComposeInput />);
    const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
    await userEvent.type(textarea, 'hello{Enter}');
    expect(textarea).toHaveValue('');
  });

  it('textarea height resets after submit (CSS grid trick auto-sizes via hidden mirror)', async () => {
    await renderWithChannel(<ComposeInput />);
    const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER) as HTMLTextAreaElement;

    await userEvent.type(textarea, 'line1\nline2\nline3');
    expect(textarea).toHaveValue('line1\nline2\nline3');

    await userEvent.keyboard('{Enter}');

    // After submit, value is cleared → mirror div shrinks → textarea shrinks
    expect(textarea).toHaveValue('');
  });

  it('renders without error when no attachments', async () => {
    await renderWithChannel(<ComposeInput />);
    expect(screen.getByPlaceholderText(COMPOSE_PLACEHOLDER)).toBeInTheDocument();
  });

  describe('@ mention', () => {
    it('typing @ opens mention dropdown with file results', async () => {
      await renderWithChannel(<ComposeInput />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      await userEvent.type(textarea, '@');

      await waitFor(() => {
        expect(screen.getByTestId('mention-dropdown')).toBeInTheDocument();
      });
    });

    it('typing @src/ lists directory contents', async () => {
      await renderWithChannel(<ComposeInput />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      await userEvent.type(textarea, '@src/');

      await waitFor(() => {
        expect(screen.getByTestId('mention-dropdown')).toBeInTheDocument();
      });
    });

    it('Escape closes mention dropdown', async () => {
      await renderWithChannel(<ComposeInput />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      await userEvent.type(textarea, '@');

      await waitFor(() => {
        expect(screen.getByTestId('mention-dropdown')).toBeInTheDocument();
      });

      await userEvent.keyboard('{Escape}');
      expect(screen.queryByTestId('mention-dropdown')).not.toBeInTheDocument();
    });

    it('selecting a file inserts @path and closes dropdown', async () => {
      const summoner = createFakeSummoner();
      const cwd = '/test/project';
      await renderWithChannel(<ComposeInput />, { summoner, cwd });

      // Seed files at the channel's resolved cwd
      summoner.filesystem().addFile(`${cwd}/index.ts`, '');

      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      await userEvent.type(textarea, '@index');

      await waitFor(() => {
        expect(screen.getByTestId('mention-dropdown')).toBeInTheDocument();
      });

      const option = screen.getByRole('option');
      await userEvent.click(option);

      expect(screen.queryByTestId('mention-dropdown')).not.toBeInTheDocument();
      expect((textarea as HTMLTextAreaElement).value).toContain('@');
    });
  });
});
