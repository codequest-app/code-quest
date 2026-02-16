import { describe, expect, it } from 'vitest';
import { calculateMPCost, getSkillForTool } from '../skill-mapper.ts';

describe('getSkillForTool', () => {
  it('maps Read to 讀心術', () => {
    const skill = getSkillForTool('Read');
    expect(skill.japaneseName).toBe('讀心術');
    expect(skill.category).toBe('read');
  });

  it('maps Write to 創造術', () => {
    expect(getSkillForTool('Write').japaneseName).toBe('創造術');
  });

  it('maps Edit to 改變術', () => {
    expect(getSkillForTool('Edit').japaneseName).toBe('改變術');
  });

  it('maps Grep to 搜索術', () => {
    expect(getSkillForTool('Grep').japaneseName).toBe('搜索術');
  });

  it('maps Glob to 探知術', () => {
    expect(getSkillForTool('Glob').japaneseName).toBe('探知術');
  });

  it('maps Bash to 指令術', () => {
    expect(getSkillForTool('Bash').japaneseName).toBe('指令術');
  });

  it('maps Task to 召喚術', () => {
    expect(getSkillForTool('Task').japaneseName).toBe('召喚術');
  });

  it('returns generic skill for unknown tools', () => {
    const skill = getSkillForTool('UnknownTool');
    expect(skill.name).toBe('UnknownTool');
    expect(skill.category).toBe('execute');
  });
});

describe('calculateMPCost', () => {
  it('returns correct MP cost for known tools', () => {
    expect(calculateMPCost('Read')).toBeGreaterThan(0);
    expect(calculateMPCost('Task')).toBeGreaterThan(calculateMPCost('Read'));
  });

  it('returns default cost for unknown tools', () => {
    expect(calculateMPCost('Unknown')).toBe(5);
  });
});
