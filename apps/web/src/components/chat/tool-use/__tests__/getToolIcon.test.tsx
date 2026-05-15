import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getToolIcon } from '../ToolUseHeader.tsx';

function renderIcon(toolName: string) {
  const { container } = render(getToolIcon(toolName) as React.ReactElement);
  return container;
}

describe('getToolIcon', () => {
  it('Bash → renders an SVG icon', () => {
    expect(renderIcon('Bash').querySelector('svg')).toBeInTheDocument();
  });

  it('Read → renders an SVG icon', () => {
    expect(renderIcon('Read').querySelector('svg')).toBeInTheDocument();
  });

  it('Write → renders an SVG icon', () => {
    expect(renderIcon('Write').querySelector('svg')).toBeInTheDocument();
  });

  it('Edit → renders an SVG icon', () => {
    expect(renderIcon('Edit').querySelector('svg')).toBeInTheDocument();
  });

  it('MultiEdit → renders an SVG icon', () => {
    expect(renderIcon('MultiEdit').querySelector('svg')).toBeInTheDocument();
  });

  it('WebSearch → renders an SVG icon', () => {
    expect(renderIcon('WebSearch').querySelector('svg')).toBeInTheDocument();
  });

  it('Agent → renders an SVG icon', () => {
    expect(renderIcon('Agent').querySelector('svg')).toBeInTheDocument();
  });

  it('Task → renders an SVG icon', () => {
    expect(renderIcon('Task').querySelector('svg')).toBeInTheDocument();
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
