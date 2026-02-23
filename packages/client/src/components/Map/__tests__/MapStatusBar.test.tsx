import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MapStatusBar } from '../MapStatusBar';

describe('MapStatusBar', () => {
  it('displays zone name', () => {
    render(<MapStatusBar zone="town" onChangeZone={vi.fn()} />);
    expect(screen.getByTestId('map-status-bar')).toHaveTextContent('Town');
  });

  it('has theme select dropdown', () => {
    render(<MapStatusBar zone="town" onChangeZone={vi.fn()} />);
    expect(screen.getByTestId('theme-select')).toBeDefined();
  });

  it('renders zone navigation buttons', () => {
    render(<MapStatusBar zone="town" onChangeZone={vi.fn()} />);
    expect(screen.getByTestId('zone-btn-town')).toBeInTheDocument();
    expect(screen.getByTestId('zone-btn-wilderness')).toBeInTheDocument();
    expect(screen.getByTestId('zone-btn-dungeon')).toBeInTheDocument();
  });

  it('highlights current zone button', () => {
    render(<MapStatusBar zone="wilderness" onChangeZone={vi.fn()} />);
    expect(screen.getByTestId('zone-btn-wilderness').className).toContain('active');
    expect(screen.getByTestId('zone-btn-town').className).not.toContain('active');
  });

  it('calls onChangeZone when zone button clicked', () => {
    const onChangeZone = vi.fn();
    render(<MapStatusBar zone="town" onChangeZone={onChangeZone} />);
    fireEvent.click(screen.getByTestId('zone-btn-wilderness'));
    expect(onChangeZone).toHaveBeenCalledWith('wilderness');
  });

  it('does not call onChangeZone when clicking current zone', () => {
    const onChangeZone = vi.fn();
    render(<MapStatusBar zone="town" onChangeZone={onChangeZone} />);
    fireEvent.click(screen.getByTestId('zone-btn-town'));
    expect(onChangeZone).not.toHaveBeenCalled();
  });
});
