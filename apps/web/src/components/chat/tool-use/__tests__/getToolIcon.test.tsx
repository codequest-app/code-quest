import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getToolIcon } from '../ToolUseHeader.tsx';

function renderIcon(toolName: string) {
  const { container } = render(getToolIcon(toolName) as React.ReactElement);
  return container;
}

describe('getToolIcon', () => {
  it('always renders with w-4 h-4 shrink-0 class', () => {
    const container = renderIcon('Bash');
    expect(container.querySelector('svg')!.getAttribute('class')).toBe('w-4 h-4 shrink-0');
  });

  it.each([
    'Bash',
    'Read',
    'Write',
    'Edit',
    'MultiEdit',
    'WebSearch',
    'Agent',
    'Task',
  ])('%s → renders an SVG icon', (toolName) => {
    const container = renderIcon(toolName);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('mcp tool → renders an SVG icon', () => {
    const container = renderIcon('mcp__my_tool');
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('unknown tool → renders an SVG icon', () => {
    const container = renderIcon('UnknownTool');
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
