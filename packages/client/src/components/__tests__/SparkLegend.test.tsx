import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SparkLegend } from '../SparkLegend';

describe('SparkLegend', () => {
  it('renders no dots when no effort', () => {
    const { container } = render(<SparkLegend />);
    expect(container.querySelectorAll('circle')).toHaveLength(0);
  });

  it('renders dot count matching effortLevels length', () => {
    const { container } = render(
      <SparkLegend effort="high" effortLevels={['low', 'medium', 'high', 'max']} />,
    );
    expect(container.querySelectorAll('circle')).toHaveLength(4);
  });

  it('renders 5 dots for 5-level effort list', () => {
    const { container } = render(
      <SparkLegend effort="xhigh" effortLevels={['low', 'medium', 'high', 'xhigh', 'max']} />,
    );
    expect(container.querySelectorAll('circle')).toHaveLength(5);
  });

  it('active dots match position in effortLevels', () => {
    const { container } = render(
      <SparkLegend effort="high" effortLevels={['low', 'medium', 'high', 'max']} />,
    );
    const circles = container.querySelectorAll('circle');
    // high is index 2, so dots 0,1,2 are active (opacity 1), dot 3 is inactive
    expect(circles[0]).toHaveAttribute('opacity', '1');
    expect(circles[1]).toHaveAttribute('opacity', '1');
    expect(circles[2]).toHaveAttribute('opacity', '1');
    expect(circles[3]).toHaveAttribute('opacity', '0.15');
  });
});
