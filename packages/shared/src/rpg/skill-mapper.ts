import type { SkillInfo } from './types.ts';

const TOOL_SKILLS: Record<string, SkillInfo> = {
  Read: { name: 'Read', japaneseName: '讀心術', category: 'read', mpCost: 3 },
  Write: { name: 'Write', japaneseName: '創造術', category: 'write', mpCost: 8 },
  Edit: { name: 'Edit', japaneseName: '改變術', category: 'write', mpCost: 6 },
  Grep: { name: 'Grep', japaneseName: '搜索術', category: 'search', mpCost: 4 },
  Glob: { name: 'Glob', japaneseName: '探知術', category: 'search', mpCost: 3 },
  Bash: { name: 'Bash', japaneseName: '指令術', category: 'execute', mpCost: 7 },
  Task: { name: 'Task', japaneseName: '召喚術', category: 'summon', mpCost: 12 },
};

export function getSkillForTool(toolName: string): SkillInfo {
  return (
    TOOL_SKILLS[toolName] ?? {
      name: toolName,
      japaneseName: toolName,
      category: 'execute' as const,
      mpCost: 5,
    }
  );
}

export function calculateMPCost(toolName: string): number {
  return getSkillForTool(toolName).mpCost;
}
