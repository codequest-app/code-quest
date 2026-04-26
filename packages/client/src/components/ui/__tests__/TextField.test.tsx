import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TextField } from '../TextField';

describe('TextField', () => {
  it('renders an input by default', () => {
    render(<TextField value="" onChange={() => {}} placeholder="p" />);
    const el = screen.getByPlaceholderText('p');
    expect(el.tagName).toBe('INPUT');
  });

  it('renders a textarea when as="textarea"', () => {
    render(<TextField as="textarea" value="" onChange={() => {}} placeholder="p" rows={3} />);
    const el = screen.getByPlaceholderText('p');
    expect(el.tagName).toBe('TEXTAREA');
  });

  it('displays current value', () => {
    render(<TextField value="foo" onChange={() => {}} placeholder="p" />);
    expect(screen.getByPlaceholderText('p')).toHaveValue('foo');
  });

  it('fires onChange with new character', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TextField value="" onChange={onChange} placeholder="p" />);
    await user.type(screen.getByPlaceholderText('p'), 'b');
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('applies shared chrome classes', () => {
    render(<TextField value="" onChange={() => {}} placeholder="p" />);
    const el = screen.getByPlaceholderText('p');
    expect(el.className).toMatch(/border/);
    expect(el.className).toMatch(/rounded/);
  });

  it('forwards aria-label', () => {
    render(<TextField value="" onChange={() => {}} aria-label="my-field" />);
    expect(screen.getByRole('textbox', { name: 'my-field' })).toBeInTheDocument();
  });

  it('honors disabled', () => {
    render(<TextField value="" onChange={() => {}} placeholder="p" disabled />);
    expect(screen.getByPlaceholderText('p')).toBeDisabled();
  });
});
