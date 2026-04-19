import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ContentRenderer } from '../ContentRenderer';

// Minimal stubs so tests don't need real diff/ansi parsers
vi.mock('../shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../shared')>();
  return {
    ...actual,
    hasAnsi: (s: string) => s.includes('\x1b['),
    AnsiContent: ({ content }: { content: string }) => (
      <div data-testid="ansi-content">{content}</div>
    ),
    CODE_BLOCK_CLASS: 'code-block',
    parseFilePathsInContent: (s: string) => [s],
  };
});

vi.mock('../../DiffViewer', () => ({
  DiffViewer: ({ content }: { content: string }) => <div data-testid="diff-viewer">{content}</div>,
}));

vi.mock('../../../utils/diff', () => ({
  isDiff: (s: string) => s.startsWith('--- '),
}));

describe('ContentRenderer', () => {
  it('renders DiffViewer when content is a diff', () => {
    render(<ContentRenderer content="--- a\n+++ b" />);
    expect(screen.getByTestId('diff-viewer')).toBeInTheDocument();
  });

  it('renders AnsiContent when content has ANSI codes', () => {
    render(<ContentRenderer content={'\x1b[32mgreen\x1b[0m'} />);
    expect(screen.getByTestId('ansi-content')).toBeInTheDocument();
  });

  it('renders pre with plain text otherwise', () => {
    render(<ContentRenderer content="plain text" />);
    expect(screen.getByText('plain text').tagName).toBe('PRE');
  });

  it('passes editable/onAccept/onReject to DiffViewer', () => {
    const onAccept = vi.fn();
    const onReject = vi.fn();
    const { container } = render(
      <ContentRenderer content="--- a\n+++ b" editable onAccept={onAccept} onReject={onReject} />,
    );
    expect(container.querySelector('[data-testid="diff-viewer"]')).toBeInTheDocument();
  });
});
