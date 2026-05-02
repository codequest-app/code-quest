import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FakeSpeechRecognition, setupSpeechRecognition } from '@/test/fake-speech-recognition';
import { SpeechInputContainer } from '../SpeechInputContainer.tsx';

setupSpeechRecognition();

describe('SpeechInputContainer', () => {
  it('calls onFinal with final transcript and resets interim state', async () => {
    const onFinal = vi.fn();
    const user = userEvent.setup();

    render(<SpeechInputContainer onFinal={onFinal} />);
    await user.click(screen.getByLabelText('Start mic'));

    const recognition = FakeSpeechRecognition.instances.at(-1);
    expect(recognition).toBeDefined();

    await act(async () => {
      recognition?.emit([{ isFinal: true, transcript: 'hello world' }]);
    });

    expect(onFinal).toHaveBeenCalledWith('hello world');
  });

  it('renders nothing when speech recognition is unsupported', () => {
    delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
    const { container } = render(<SpeechInputContainer onFinal={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
