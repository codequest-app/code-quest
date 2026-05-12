import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MarkdownContent } from '../MarkdownContent.tsx';

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

  it('fenced code block without language renders without copy button', () => {
    const { container } = render(<MarkdownContent content={'```\nhello\n```'} />);
    expect(container.textContent).toContain('hello');
    expect(container.querySelector('button[title="Copy"], button[title="Copy code"]')).toBeNull();
  });

  it('fenced code block with language renders without copy button (Copyable wraps externally)', () => {
    const { container } = render(<MarkdownContent content={'```ts\nconst x = 1;\n```'} />);
    const copyButtons = container.querySelectorAll(
      'button[title="Copy"], button[title="Copy code"], button[title="Copied!"]',
    );
    expect(copyButtons).toHaveLength(0);
  });

  it('inline code does not get a copy button', () => {
    const { container } = render(<MarkdownContent content="Use `useState` please" />);
    expect(container.querySelector('button[title="Copy"], button[title="Copy code"]')).toBeNull();
  });

  it('link shows "Copy Link" context menu on right-click and writes href', async () => {
    const { container } = render(
      <MarkdownContent content="See [docs](https://example.com/docs)" />,
    );
    const anchor = container.querySelector('a');
    expect(anchor).not.toBeNull();
    if (!anchor) return;
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const evt = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 10,
      clientY: 10,
    });
    anchor.dispatchEvent(evt);
    const menuItem = await screen.findByText('Copy Link');
    menuItem.click();
    expect(writeText).toHaveBeenCalledWith('https://example.com/docs');
  });

  it('fenced code block with language renders via CodeBlock (not plain pre.bg-code-block)', () => {
    const { container } = render(<MarkdownContent content={'```tsx\nconst x = 1;\n```'} />);
    expect(container.textContent).toContain('const x = 1');
    // No plain Tailwind bg-code-block pre — CodeBlock renders via SyntaxHighlighter
    expect(container.querySelector('pre.bg-code-block')).not.toBeInTheDocument();
  });
});
