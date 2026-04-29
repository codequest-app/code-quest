import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  FakeSpeechRecognition,
  setupSpeechRecognition,
} from '../../../../test/fake-speech-recognition';
import { createFakeSummoner } from '../../../../test/fake-summoner';
import { renderWithWorkspace } from '../../../../test/render-with-workspace';

async function setup() {
  const summoner = createFakeSummoner();
  const result = await renderWithWorkspace({ summoner });
  const project = await result.addProject();
  await project.launchSession();
  return result;
}

setupSpeechRecognition();

describe('ChatInputArea mic placement', () => {
  it('renders mic button inside the chat input box (not in the toolbar row)', async () => {
    await setup();

    const micButton = screen.getByLabelText('Start mic');
    const inputBox = micButton.closest('[class*="bg-surface"]');
    expect(inputBox).not.toBeNull();

    // Mic lives in an absolutely-positioned wrapper inside the input box,
    // not in the toolbar's flex row (which has no `absolute`).
    const absoluteWrapper = micButton.closest('[class*="absolute"]');
    expect(absoluteWrapper).not.toBeNull();
    expect(absoluteWrapper?.className).toMatch(/right-/);
  });
});

describe('ChatInputArea speech-to-text wiring', () => {
  it('inserts final transcript into the textarea when recognition emits final result', async () => {
    const { user } = await setup();

    await user.click(screen.getByLabelText('Start mic'));

    const recognition = FakeSpeechRecognition.instances.at(-1);
    expect(recognition).toBeDefined();

    await act(async () => {
      recognition?.emit([{ isFinal: true, transcript: 'hello world' }]);
    });

    const textarea = screen
      .getAllByRole('textbox')
      .find((el) => el.tagName === 'TEXTAREA') as HTMLTextAreaElement;
    expect(textarea.value).toBe('hello world');
  });
});
