import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ContentRenderer } from '../ContentRenderer.tsx';

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

  it('marks error output with alert role when isError is true', () => {
    render(<ContentRenderer content="error output" isError />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('error output');
  });

  it('does not use alert role when isError is false', () => {
    render(<ContentRenderer content="normal output" isError={false} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  describe('bare mode (for use inside ToolBlock)', () => {
    it('plain text renders content in bare mode', () => {
      render(<ContentRenderer content="plain text" bare />);
      expect(screen.getByText('plain text')).toBeInTheDocument();
    });

    it('ANSI content renders in bare mode', () => {
      render(<ContentRenderer content={'\x1b[32mgreen\x1b[0m'} bare />);
      expect(screen.getByLabelText('ansi-content')).toBeInTheDocument();
    });

    it('plain text renders content when not bare', () => {
      render(<ContentRenderer content="plain text" />);
      expect(screen.getByText('plain text')).toBeInTheDocument();
    });
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
