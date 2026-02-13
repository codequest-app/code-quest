import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ThinkingBlock } from '../ThinkingBlock';

describe('ThinkingBlock', () => {
  it('should render collapsed by default', () => {
    render(<ThinkingBlock content="Deep thoughts" />);

    expect(screen.getByTestId('thinking-block')).toBeInTheDocument();
    expect(screen.getByText('Thinking...')).toBeInTheDocument();
    expect(screen.queryByText('Deep thoughts')).not.toBeInTheDocument();
  });

  it('should expand to show content when clicked', () => {
    render(<ThinkingBlock content="Deep thoughts" />);

    fireEvent.click(screen.getByText('Thinking...'));

    expect(screen.getByText('Deep thoughts')).toBeInTheDocument();
  });

  it('should collapse again when clicked twice', () => {
    render(<ThinkingBlock content="Deep thoughts" />);

    fireEvent.click(screen.getByText('Thinking...'));
    expect(screen.getByText('Deep thoughts')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Thinking...'));
    expect(screen.queryByText('Deep thoughts')).not.toBeInTheDocument();
  });

  it('should have correct aria-expanded state', () => {
    render(<ThinkingBlock content="thoughts" />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });
});
