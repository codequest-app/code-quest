import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ContentRenderer } from '../ContentRenderer';

// Uses real DiffViewer + AnsiContent (principle 2: prefer no double for
// internal modules). Real components expose the testids asserted below.

const sampleDiff = ['--- a/file.txt', '+++ b/file.txt', '@@ -1,1 +1,1 @@', '-old', '+new'].join(
  '\n',
);

describe('ContentRenderer', () => {
  it('routes to DiffViewer when content is a diff', () => {
    render(<ContentRenderer content={sampleDiff} />);
    expect(screen.getByRole('region', { name: 'diff-filename' })).toHaveTextContent('file.txt');
  });

  it('routes to AnsiContent when content has ANSI codes', () => {
    render(<ContentRenderer content={'\x1b[32mgreen\x1b[0m'} />);
    expect(screen.getByLabelText('ansi-content')).toBeInTheDocument();
  });

  it('renders plain text inside <pre> when neither diff nor ANSI', () => {
    render(<ContentRenderer content="plain text" />);
    expect(screen.getByText('plain text').tagName).toBe('PRE');
  });

  it('forwards editable/onAccept/onReject to DiffViewer', () => {
    const onAccept = vi.fn();
    const onReject = vi.fn();
    render(
      <ContentRenderer content={sampleDiff} editable onAccept={onAccept} onReject={onReject} />,
    );
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
  });
});
