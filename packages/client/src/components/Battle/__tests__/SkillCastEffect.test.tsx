import type { SkillInfo } from '@code-quest/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SkillCastEffect } from '../SkillCastEffect';

const skill: SkillInfo = {
  name: 'Read',
  japaneseName: '讀心術',
  category: 'read',
  mpCost: 3,
};

describe('SkillCastEffect', () => {
  it('renders skill Japanese name', () => {
    render(<SkillCastEffect skill={skill} />);
    expect(screen.getByTestId('skill-cast-effect')).toHaveTextContent('讀心術');
  });

  it('renders skill English name', () => {
    render(<SkillCastEffect skill={skill} />);
    expect(screen.getByTestId('skill-cast-effect')).toHaveTextContent('Read');
  });

  it('is visible on mount', () => {
    render(<SkillCastEffect skill={skill} />);
    expect(screen.getByTestId('skill-cast-effect')).toBeDefined();
  });
});
