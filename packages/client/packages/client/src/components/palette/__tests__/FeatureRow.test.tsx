import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Feature } from '@/lib/feature';
import { FeatureRow } from '../FeatureRow.tsx';

const FLAT_FEATURE: Feature = {
  id: 'test',
  label: 'Test Feature',
  execute: vi.fn(),
};

describe('FeatureRow', () => {
  it('renders the feature label', () => {
    render(<FeatureRow feature={FLAT_FEATURE} isActive={false} onActiveChange={vi.fn()} />);
    expect(screen.getByText('Test Feature')).toBeInTheDocument();
  });

  it('renders without onActiveChange (optional)', () => {
    render(<FeatureRow feature={FLAT_FEATURE} isActive={false} />);
    expect(screen.getByText('Test Feature')).toBeInTheDocument();
  });
});
