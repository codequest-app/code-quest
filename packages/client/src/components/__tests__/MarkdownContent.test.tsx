import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MarkdownContent } from '../MarkdownContent';

describe('MarkdownContent', () => {
  it('renders content inside a prose wrapper div', () => {
    const { container } = render(<MarkdownContent content="Hello world" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.tagName).toBe('DIV');
    expect(wrapper.className).toContain('prose');
  });

  it('renders h2 for ## heading', () => {
    render(<MarkdownContent content="## Section title" />);
    expect(screen.getByRole('heading', { level: 2, name: 'Section title' })).toBeInTheDocument();
  });

  it('renders ul/li for - list items', () => {
    const { container } = render(<MarkdownContent content={`- item one\n- item two`} />);
    expect(container.querySelector('ul')).toBeInTheDocument();
    expect(container.querySelectorAll('li')).toHaveLength(2);
  });

  it('renders inline code with code element', () => {
    render(<MarkdownContent content="Use `useState` here" />);
    expect(document.querySelector('code')).toBeInTheDocument();
    expect(screen.getByText('useState')).toBeInTheDocument();
  });

  it('prose wrapper has max-w-none to avoid typography default max-width', () => {
    const { container } = render(<MarkdownContent content="text" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain('max-w-none');
  });

  it('fenced code block with language renders via CodeBlock (not plain pre.bg-code-block)', () => {
    const { container } = render(<MarkdownContent content={'```tsx\nconst x = 1;\n```'} />);
    expect(container.textContent).toContain('const x = 1');
    // No plain Tailwind bg-code-block pre — CodeBlock renders via SyntaxHighlighter
    expect(container.querySelector('pre.bg-code-block')).not.toBeInTheDocument();
  });
});
