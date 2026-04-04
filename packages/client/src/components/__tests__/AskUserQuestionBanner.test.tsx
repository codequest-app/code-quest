import type { Question } from '@code-quest/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AskUserQuestionBannerProps } from '../AskUserQuestionBanner';
import { AskUserQuestionBanner } from '../AskUserQuestionBanner';

const makeProps = (questions: Question[], onRespond = vi.fn()): AskUserQuestionBannerProps => ({
  input: { questions },
  questions,
  onRespond,
});

describe('AskUserQuestionBanner', () => {
  it('renders question text and header', () => {
    render(
      <AskUserQuestionBanner
        {...makeProps([
          {
            question: 'Which library?',
            header: 'Library',
            options: [
              { label: 'React', description: 'UI lib' },
              { label: 'Vue', description: 'Progressive' },
            ],
            multiSelect: false,
          },
        ])}
      />,
    );
    expect(screen.getByText('Which library?')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  it('renders radio buttons for single select and submits chosen option', async () => {
    const onRespond = vi.fn();
    const user = userEvent.setup();
    render(
      <AskUserQuestionBanner
        {...makeProps(
          [
            {
              question: 'Pick one?',
              header: 'Choice',
              options: [
                { label: 'A', description: 'desc A' },
                { label: 'B', description: 'desc B' },
              ],
              multiSelect: false,
            },
          ],
          onRespond,
        )}
      />,
    );

    expect(screen.getAllByRole('radio')).toHaveLength(3); // A, B, Other
    await user.click(screen.getByRole('radio', { name: /^A$/ }));
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(onRespond).toHaveBeenCalledWith({
      behavior: 'allow',
      updatedInput: expect.objectContaining({
        answers: { 'Pick one?': 'A' },
      }),
    });
  });

  it('renders checkboxes for multi select and submits joined labels', async () => {
    const onRespond = vi.fn();
    const user = userEvent.setup();
    render(
      <AskUserQuestionBanner
        {...makeProps(
          [
            {
              question: 'Pick many?',
              header: 'Multi',
              options: [
                { label: 'X', description: 'desc X' },
                { label: 'Y', description: 'desc Y' },
                { label: 'Z', description: 'desc Z' },
              ],
              multiSelect: true,
            },
          ],
          onRespond,
        )}
      />,
    );

    expect(screen.getAllByRole('checkbox')).toHaveLength(4); // X, Y, Z, Other
    await user.click(screen.getByRole('checkbox', { name: /^X$/ }));
    await user.click(screen.getByRole('checkbox', { name: /^Z$/ }));
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(onRespond).toHaveBeenCalledWith({
      behavior: 'allow',
      updatedInput: expect.objectContaining({
        answers: { 'Pick many?': 'X, Z' },
      }),
    });
  });

  it('disables Submit when no option is selected', () => {
    render(
      <AskUserQuestionBanner
        {...makeProps([
          {
            question: 'Pick one?',
            header: 'H',
            options: [{ label: 'A', description: 'd' }],
            multiSelect: false,
          },
        ])}
      />,
    );
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
  });

  it('displays option descriptions', () => {
    render(
      <AskUserQuestionBanner
        {...makeProps([
          {
            question: 'Q?',
            header: 'H',
            options: [{ label: 'A', description: 'Alpha description' }],
            multiSelect: false,
          },
        ])}
      />,
    );
    expect(screen.getByText(/Alpha description/)).toBeInTheDocument();
  });

  it('shows text input when Other is selected and submits typed text', async () => {
    const onRespond = vi.fn();
    const user = userEvent.setup();
    render(
      <AskUserQuestionBanner
        {...makeProps(
          [
            {
              question: 'Pick?',
              header: 'H',
              options: [{ label: 'A', description: 'd' }],
              multiSelect: false,
            },
          ],
          onRespond,
        )}
      />,
    );

    await user.click(screen.getByRole('radio', { name: /other/i }));
    const textInput = screen.getByPlaceholderText(/type your answer/i);
    await user.type(textInput, 'custom answer');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(onRespond).toHaveBeenCalledWith({
      behavior: 'allow',
      updatedInput: expect.objectContaining({
        answers: { 'Pick?': 'custom answer' },
      }),
    });
  });

  it('handles multiple questions independently', async () => {
    const onRespond = vi.fn();
    const user = userEvent.setup();
    render(
      <AskUserQuestionBanner
        {...makeProps(
          [
            {
              question: 'Q1?',
              header: 'H1',
              options: [
                { label: 'A', description: 'd' },
                { label: 'B', description: 'd' },
              ],
              multiSelect: false,
            },
            {
              question: 'Q2?',
              header: 'H2',
              options: [
                { label: 'X', description: 'd' },
                { label: 'Y', description: 'd' },
              ],
              multiSelect: true,
            },
          ],
          onRespond,
        )}
      />,
    );

    await user.click(screen.getByRole('radio', { name: /^B$/ }));
    await user.click(screen.getByRole('checkbox', { name: /^X$/ }));
    await user.click(screen.getByRole('checkbox', { name: /^Y$/ }));
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(onRespond).toHaveBeenCalledWith({
      behavior: 'allow',
      updatedInput: expect.objectContaining({
        answers: { 'Q1?': 'B', 'Q2?': 'X, Y' },
      }),
    });
  });

  it('disables Submit when Other is selected with empty text in multi-select alongside regular option', async () => {
    const user = userEvent.setup();
    render(
      <AskUserQuestionBanner
        {...makeProps([
          {
            question: 'Pick many?',
            header: 'Multi',
            options: [{ label: 'A', description: 'd' }],
            multiSelect: true,
          },
        ])}
      />,
    );

    await user.click(screen.getByRole('checkbox', { name: /^A$/ }));
    await user.click(screen.getByRole('checkbox', { name: /other/i }));
    // Other text is empty — Submit should be disabled
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
  });

  it('sends deny response on Dismiss', async () => {
    const onRespond = vi.fn();
    const user = userEvent.setup();
    render(
      <AskUserQuestionBanner
        {...makeProps(
          [
            {
              question: 'Q?',
              header: 'H',
              options: [{ label: 'A', description: 'd' }],
              multiSelect: false,
            },
          ],
          onRespond,
        )}
      />,
    );

    await user.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(onRespond).toHaveBeenCalledWith({
      behavior: 'deny',
      message: 'User dismissed',
      interrupt: false,
    });
  });
});
