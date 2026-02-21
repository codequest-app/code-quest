import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OutputStyleSelector } from '../OutputStyleSelector';

describe('OutputStyleSelector', () => {
  it('should not render when no availableStyles', () => {
    const { container } = render(<OutputStyleSelector />);
    expect(container.innerHTML).toBe('');
  });

  it('should not render when availableStyles is empty', () => {
    const { container } = render(<OutputStyleSelector availableStyles={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('should render options for each style', () => {
    render(<OutputStyleSelector availableStyles={['concise', 'verbose', 'markdown']} />);

    const select = screen.getByTestId('output-style-selector');
    expect(select).toBeInTheDocument();
    expect(select.querySelectorAll('option')).toHaveLength(3);
  });

  it('should call onStyleChange when selection changes', () => {
    const onChange = vi.fn();
    render(
      <OutputStyleSelector
        availableStyles={['concise', 'verbose']}
        currentStyle="concise"
        onStyleChange={onChange}
      />,
    );

    fireEvent.change(screen.getByTestId('output-style-selector'), {
      target: { value: 'verbose' },
    });
    expect(onChange).toHaveBeenCalledWith('verbose');
  });

  it('should reflect currentStyle as selected value', () => {
    render(<OutputStyleSelector availableStyles={['concise', 'verbose']} currentStyle="verbose" />);

    expect((screen.getByTestId('output-style-selector') as HTMLSelectElement).value).toBe(
      'verbose',
    );
  });
});
