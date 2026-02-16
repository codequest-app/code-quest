import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressBar } from '../ProgressBar';

describe('ProgressBar', () => {
  it('renders with correct width percentage', () => {
    render(<ProgressBar value={75} max={100} type="hp" />);
    const fill = screen.getByTestId('progress-fill-hp');
    expect(fill.style.width).toBe('75%');
  });

  it('clamps to 0% when value is negative', () => {
    render(<ProgressBar value={-10} max={100} type="hp" />);
    const fill = screen.getByTestId('progress-fill-hp');
    expect(fill.style.width).toBe('0%');
  });

  it('clamps to 100% when value exceeds max', () => {
    render(<ProgressBar value={150} max={100} type="mp" />);
    const fill = screen.getByTestId('progress-fill-mp');
    expect(fill.style.width).toBe('100%');
  });

  it('uses blue color for MP bar', () => {
    render(<ProgressBar value={50} max={100} type="mp" />);
    const fill = screen.getByTestId('progress-fill-mp');
    expect(fill.style.backgroundColor).toBe('rgb(66, 165, 245)');
  });

  it('uses gold color for EXP bar', () => {
    render(<ProgressBar value={50} max={100} type="exp" />);
    const fill = screen.getByTestId('progress-fill-exp');
    expect(fill.style.backgroundColor).toBe('rgb(255, 213, 79)');
  });
});
