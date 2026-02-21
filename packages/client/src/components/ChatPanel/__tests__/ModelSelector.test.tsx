import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ModelSelector } from '../ModelSelector';

describe('ModelSelector', () => {
  const models = [
    { value: 'opus', displayName: 'Opus', description: 'Best model' },
    { value: 'sonnet', displayName: 'Sonnet', description: 'Fast model' },
  ];

  it('should not render when no models', () => {
    const { container } = render(<ModelSelector />);
    expect(container.innerHTML).toBe('');
  });

  it('should not render when models is empty', () => {
    const { container } = render(<ModelSelector models={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('should render options for each model', () => {
    render(<ModelSelector models={models} />);

    const select = screen.getByTestId('model-selector');
    expect(select).toBeInTheDocument();
    expect(select.querySelectorAll('option')).toHaveLength(2);
    expect(screen.getByText('Opus')).toBeInTheDocument();
    expect(screen.getByText('Sonnet')).toBeInTheDocument();
  });

  it('should call onModelChange when selection changes', () => {
    const onChange = vi.fn();
    render(<ModelSelector models={models} currentModel="opus" onModelChange={onChange} />);

    fireEvent.change(screen.getByTestId('model-selector'), { target: { value: 'sonnet' } });
    expect(onChange).toHaveBeenCalledWith('sonnet');
  });

  it('should reflect currentModel as selected value', () => {
    render(<ModelSelector models={models} currentModel="sonnet" />);

    expect((screen.getByTestId('model-selector') as HTMLSelectElement).value).toBe('sonnet');
  });
});
