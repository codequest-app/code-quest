import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RPGQuestionModal } from '../RPGQuestionModal';

describe('RPGQuestionModal', () => {
  const defaultProps = {
    question: 'Which approach do you prefer?',
    options: ['Option A', 'Option B', 'Option C'],
    onSelect: vi.fn(),
  };

  it('renders the question text', () => {
    render(<RPGQuestionModal {...defaultProps} />);
    expect(screen.getByText('Which approach do you prefer?')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<RPGQuestionModal {...defaultProps} />);
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
    expect(screen.getByText('Option C')).toBeInTheDocument();
  });

  it('highlights selected option with cursor', () => {
    render(<RPGQuestionModal {...defaultProps} />);
    const items = screen.getAllByTestId(/^question-option-/);
    expect(items[0].textContent).toContain('▶');
  });

  it('navigates options with arrow keys', () => {
    render(<RPGQuestionModal {...defaultProps} />);
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    const items = screen.getAllByTestId(/^question-option-/);
    expect(items[1].textContent).toContain('▶');
  });

  it('selects option on Enter', () => {
    const onSelect = vi.fn();
    render(<RPGQuestionModal {...defaultProps} onSelect={onSelect} />);
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith(0);
  });

  it('wraps around on arrow navigation', () => {
    render(<RPGQuestionModal {...defaultProps} />);
    fireEvent.keyDown(document, { key: 'ArrowUp' });
    const items = screen.getAllByTestId(/^question-option-/);
    expect(items[2].textContent).toContain('▶');
  });
});
