import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchField } from '../SearchField';

describe('SearchField', () => {
  it('renders a search input with the provided placeholder', () => {
    render(<SearchField placeholder="Search…" value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText('Search…')).toBeInTheDocument();
  });

  it('forwards value to the input element', () => {
    render(<SearchField value="foo" onChange={() => {}} />);
    expect(screen.getByRole('searchbox')).toHaveValue('foo');
  });

  it('fires onChange on input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchField value="" onChange={onChange} placeholder="s" />);
    await user.type(screen.getByRole('searchbox'), 'x');
    expect(onChange).toHaveBeenCalledWith('x');
  });

  it('renders a magnifier icon (leading)', () => {
    const { container } = render(<SearchField value="" onChange={() => {}} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('supports a trailing slot', () => {
    render(
      <SearchField
        value=""
        onChange={() => {}}
        trailing={
          <span role="status" aria-label="trailing-slot">
            X
          </span>
        }
      />,
    );
    expect(screen.getByRole('status', { name: 'trailing-slot' })).toBeInTheDocument();
  });

  it('forwards ref to the inner input', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<SearchField value="" onChange={() => {}} inputRef={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('input uses text-base for proper scaling with font-size axis', () => {
    render(<SearchField value="" onChange={() => {}} />);
    const input = screen.getByRole('searchbox');
    expect(input.className).toMatch(/text-base/);
    expect(input.className).not.toMatch(/text-sm/);
  });
});
