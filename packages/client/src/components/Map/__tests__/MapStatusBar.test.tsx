import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMapStore } from '../../../stores/mapStore';
import { MapStatusBar } from '../MapStatusBar';

describe('MapStatusBar', () => {
  beforeEach(() => {
    useMapStore.setState({
      currentZone: 'town',
      playerPosition: { x: 4, y: 4 },
    });
  });

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

  it('shows sub-zone name when in wilderness', () => {
    useMapStore.setState({ currentZone: 'wilderness', playerPosition: { x: 7, y: 2 } });
    render(<MapStatusBar zone="wilderness" onChangeZone={vi.fn()} />);
    expect(screen.getByTestId('map-status-bar')).toHaveTextContent('Mountains');
  });

  it('does not show sub-zone in town', () => {
    render(<MapStatusBar zone="town" onChangeZone={vi.fn()} />);
    expect(screen.queryByTestId('sub-zone-label')).toBeNull();
  });
});
