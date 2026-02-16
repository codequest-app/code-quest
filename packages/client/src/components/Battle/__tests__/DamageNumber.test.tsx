import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DamageNumber } from '../DamageNumber';

describe('DamageNumber', () => {
  it('renders damage value', () => {
    render(<DamageNumber value={150} />);
    expect(screen.getByTestId('damage-number')).toHaveTextContent('-150');
  });

  it('shows CRITICAL label when critical', () => {
    render(<DamageNumber value={300} isCritical />);
    expect(screen.getByTestId('damage-number')).toHaveTextContent('CRITICAL');
  });

  it('renders without critical label by default', () => {
    render(<DamageNumber value={100} />);
    expect(screen.getByTestId('damage-number').textContent).not.toContain('CRITICAL');
  });
});
