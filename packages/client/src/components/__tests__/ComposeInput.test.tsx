import { segments as s } from '@code-quest/summoner/test';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
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

  it('textarea height resets immediately after submit (no flash of tall empty box)', async () => {
    await renderWithChannel(<ComposeInput />);
    const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER) as HTMLTextAreaElement;

    // Simulate multi-line input that triggers autogrow
    let mockScrollHeight = 150;
    Object.defineProperty(textarea, 'scrollHeight', {
      get: () => mockScrollHeight,
      configurable: true,
    });
    await userEvent.type(textarea, 'line1\nline2\nline3');
    expect(textarea.style.height).toBe('150px');

    // After submit, scrollHeight returns to single-line size
    mockScrollHeight = 24;
    await userEvent.keyboard('{Enter}');

    // With useLayoutEffect, height is reset before paint
    // With useEffect, the old 150px would persist until next frame
    expect(textarea.style.height).toBe('24px');
  });

  it('renders without error when no attachments', async () => {
    await renderWithChannel(<ComposeInput />);
    expect(screen.getByPlaceholderText(COMPOSE_PLACEHOLDER)).toBeInTheDocument();
  });
});
