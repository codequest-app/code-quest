import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { sendUserMessage } from '@/test/helpers';
import { renderWithWorkspace } from '@/test/render-with-workspace';

describe('title derived from messages', () => {
  it('sets tab title from first user message', async () => {
    const { user } = await renderWithWorkspace();
    await sendUserMessage(user, 'Fix the login bug please');

    expect(screen.getByLabelText(/^Close /)).toHaveAccessibleName('Close Fix the login bug please');
  });

  it('does not update title on second message', async () => {
    const { user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);

    await user.click(textarea);
    await user.type(textarea, 'First message');
    await user.keyboard('{Enter}');

    await user.click(textarea);
    await user.type(textarea, 'Second message');
    await user.keyboard('{Enter}');

    expect(screen.getByLabelText(/^Close /)).toHaveAccessibleName('Close First message');
  });
});
