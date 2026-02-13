import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AskUserQuestionData } from '../../../stores/chatStore';
import { QuestionPrompt } from '../QuestionPrompt';

describe('QuestionPrompt', () => {
  const mockOnAnswer = vi.fn();
  const mockOnDismiss = vi.fn();

  const singleQuestion: AskUserQuestionData[] = [
    {
      question: 'Which library should we use?',
      header: 'Library',
      options: [
        { label: 'React', description: 'Popular UI library' },
        { label: 'Vue', description: 'Progressive framework' },
      ],
      multiSelect: false,
    },
  ];

  const multiSelectQuestion: AskUserQuestionData[] = [
    {
      question: 'Which features do you want?',
      header: 'Features',
      options: [
        { label: 'Auth', description: 'Authentication' },
        { label: 'DB', description: 'Database' },
        { label: 'Cache', description: 'Caching layer' },
      ],
      multiSelect: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render question text and options', () => {
    render(
      <QuestionPrompt
        questions={singleQuestion}
        onAnswer={mockOnAnswer}
        onDismiss={mockOnDismiss}
      />,
    );

    expect(screen.getByTestId('question-prompt')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.getByText('Which library should we use?')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Vue')).toBeInTheDocument();
    expect(screen.getByText('Popular UI library')).toBeInTheDocument();
  });

  it('should call onAnswer with label on single select click', () => {
    render(
      <QuestionPrompt
        questions={singleQuestion}
        onAnswer={mockOnAnswer}
        onDismiss={mockOnDismiss}
      />,
    );

    fireEvent.click(screen.getByTestId('question-option-0-0'));
    expect(mockOnAnswer).toHaveBeenCalledWith('React');
  });

  it('should show Other input when Other is clicked', () => {
    render(
      <QuestionPrompt
        questions={singleQuestion}
        onAnswer={mockOnAnswer}
        onDismiss={mockOnDismiss}
      />,
    );

    fireEvent.click(screen.getByTestId('question-other-0'));
    expect(screen.getByLabelText('Other answer')).toBeInTheDocument();
  });

  it('should submit Other free text input', () => {
    render(
      <QuestionPrompt
        questions={singleQuestion}
        onAnswer={mockOnAnswer}
        onDismiss={mockOnDismiss}
      />,
    );

    fireEvent.click(screen.getByTestId('question-other-0'));
    const input = screen.getByLabelText('Other answer');
    fireEvent.change(input, { target: { value: 'Custom answer' } });
    fireEvent.click(screen.getByTestId('question-other-submit-0'));

    expect(mockOnAnswer).toHaveBeenCalledWith('Custom answer');
  });

  it('should call onDismiss when Dismiss is clicked', () => {
    render(
      <QuestionPrompt
        questions={singleQuestion}
        onAnswer={mockOnAnswer}
        onDismiss={mockOnDismiss}
      />,
    );

    fireEvent.click(screen.getByTestId('question-dismiss'));
    expect(mockOnDismiss).toHaveBeenCalled();
  });

  it('should show Submit button for multi-select questions', () => {
    render(
      <QuestionPrompt
        questions={multiSelectQuestion}
        onAnswer={mockOnAnswer}
        onDismiss={mockOnDismiss}
      />,
    );

    expect(screen.getByTestId('question-multi-submit')).toBeInTheDocument();
  });

  it('should allow toggling multiple options and submit', () => {
    render(
      <QuestionPrompt
        questions={multiSelectQuestion}
        onAnswer={mockOnAnswer}
        onDismiss={mockOnDismiss}
      />,
    );

    fireEvent.click(screen.getByTestId('question-option-0-0'));
    fireEvent.click(screen.getByTestId('question-option-0-2'));
    fireEvent.click(screen.getByTestId('question-multi-submit'));

    expect(mockOnAnswer).toHaveBeenCalledWith('Auth, Cache');
  });

  it('should submit Other text via Enter key', () => {
    render(
      <QuestionPrompt
        questions={singleQuestion}
        onAnswer={mockOnAnswer}
        onDismiss={mockOnDismiss}
      />,
    );

    fireEvent.click(screen.getByTestId('question-other-0'));
    const input = screen.getByLabelText('Other answer');
    fireEvent.change(input, { target: { value: 'Enter answer' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnAnswer).toHaveBeenCalledWith('Enter answer');
  });
});
