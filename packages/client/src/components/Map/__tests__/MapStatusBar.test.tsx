import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MapStatusBar } from '../MapStatusBar';

describe('MapStatusBar', () => {
  it('displays zone name', () => {
    render(<MapStatusBar zone="town" />);
    expect(screen.getByTestId('map-status-bar')).toHaveTextContent('Town');
  });

  it('has theme select dropdown', () => {
    render(<MapStatusBar zone="town" />);
    expect(screen.getByTestId('theme-select')).toBeDefined();
  });
});
