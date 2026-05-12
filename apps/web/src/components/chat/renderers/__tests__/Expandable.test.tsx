import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Expandable } from '../Expandable.tsx';

function simulateOverflow() {
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(1000);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(300);
}

describe('Expandable', () => {
  it('renders children', () => {
    render(<Expandable>Hello world</Expandable>);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('does not show "Show more" button when content fits', () => {
    render(<Expandable>Short content</Expandable>);
    expect(screen.queryByText('Show more')).not.toBeInTheDocument();
  });

  it('shows "Show more" button when content overflows', () => {
    simulateOverflow();
    render(<Expandable>Very long text</Expandable>);
    expect(screen.getByText('Show more')).toBeInTheDocument();
  });

  it('toggles expanded state when Show more clicked', async () => {
    simulateOverflow();
    render(<Expandable>Very long text</Expandable>);

    await userEvent.click(screen.getByText('Show more'));
    expect(screen.getByText('Show less')).toBeInTheDocument();
    expect(screen.queryByText('Show more')).not.toBeInTheDocument();
  });

  it('collapses back when Show less clicked', async () => {
    simulateOverflow();
    render(<Expandable>Very long text</Expandable>);

    await userEvent.click(screen.getByText('Show more'));
    await userEvent.click(screen.getByText('Show less'));
    expect(screen.getByText('Show more')).toBeInTheDocument();
  });

  it('defaults to expanded when defaultOpen={true}', () => {
    simulateOverflow();
    render(<Expandable defaultOpen={true}>Content</Expandable>);
    expect(screen.queryByText('Show more')).not.toBeInTheDocument();
    expect(screen.getByLabelText('truncated-inner')).toHaveAttribute('data-expanded', 'true');
  });

  it('defaults to collapsed when defaultOpen not set', () => {
    simulateOverflow();
    render(<Expandable maxHeight={300}>Content</Expandable>);
    expect(screen.getByText('Show more')).toBeInTheDocument();
    expect(screen.getByLabelText('truncated-inner')).toHaveAttribute('data-expanded', 'false');
  });

  it('keeps Show less visible after expanding', async () => {
    let scrollHeight = 1000;
    let clientHeight = 300;
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => scrollHeight);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => clientHeight);

    const { rerender } = render(<Expandable>Long content</Expandable>);
    await userEvent.click(screen.getByText('Show more'));

    scrollHeight = 1000;
    clientHeight = 1000;
    rerender(<Expandable>Long content</Expandable>);

    expect(screen.getByText('Show less')).toBeInTheDocument();
  });
});
