import {
  CommandLineIcon,
  CpuChipIcon,
  DocumentMagnifyingGlassIcon,
  DocumentPlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  ServerIcon,
  WrenchIcon,
} from '@heroicons/react/24/outline';
import { describe, expect, it } from 'vitest';
import { getToolIcon } from '../ToolUseHeader.tsx';

function iconType(toolName: string): unknown {
  return (getToolIcon(toolName) as React.ReactElement).type;
}

function iconClass(toolName: string): string {
  return (
    ((getToolIcon(toolName) as React.ReactElement).props as { className?: string }).className ?? ''
  );
}

describe('getToolIcon', () => {
  it('always renders with w-4 h-4 shrink-0 class', () => {
    const cls = iconClass('Bash');
    expect(cls).toBe('w-4 h-4 shrink-0');
  });

  it.each([
    ['Bash', CommandLineIcon],
    ['Read', DocumentMagnifyingGlassIcon],
    ['Write', DocumentPlusIcon],
    ['Edit', PencilSquareIcon],
    ['MultiEdit', PencilSquareIcon],
    ['WebSearch', MagnifyingGlassIcon],
    ['Agent', CpuChipIcon],
    ['Task', CpuChipIcon],
  ])('%s → correct icon component', (toolName, expected) => {
    expect(iconType(toolName)).toBe(expected);
  });

  it('mcp tool → ServerIcon', () => {
    expect(iconType('mcp__my_tool')).toBe(ServerIcon);
  });

  it('unknown tool → WrenchIcon', () => {
    expect(iconType('UnknownTool')).toBe(WrenchIcon);
  });
});
