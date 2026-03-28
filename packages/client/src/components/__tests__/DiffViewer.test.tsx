import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { extractNewContent, isDiff, parseDiffFileName } from '../../utils/diff';
import { DiffViewer } from '../DiffViewer';

const sampleDiff = [
  '--- a/file.txt',
  '+++ b/file.txt',
  '@@ -1,2 +1,2 @@',
  '-old line',
  '+new line',
  ' same line',
].join('\n');

describe('isDiff', () => {
  it('detects unified diff format', () => {
    expect(isDiff(sampleDiff)).toBe(true);
    expect(isDiff('plain text')).toBe(false);
  });

  it('returns false for diff without @@ hunks', () => {
    expect(isDiff('--- a/file\n+++ b/file\n')).toBe(false);
  });
});

describe('parseDiffFileName', () => {
  it('extracts filename from b/ prefix', () => {
    expect(parseDiffFileName(sampleDiff)).toBe('file.txt');
  });

  it('returns null for content without filename', () => {
    expect(parseDiffFileName('@@ -1,3 +1,3 @@\n-old\n+new')).toBeNull();
  });
});

describe('DiffViewer', () => {
  it('renders diff content with colored lines', () => {
    const { container } = render(<DiffViewer content={sampleDiff} />);
    const pre = container.querySelector('pre');
    expect(pre?.querySelector('.text-success')?.textContent).toContain('+new line');
    expect(pre?.querySelector('.text-danger')?.textContent).toContain('-old line');
  });

  it('shows filename header', () => {
    render(<DiffViewer content={sampleDiff} />);
    expect(screen.getByText('file.txt')).toBeInTheDocument();
  });

  it('shows accept/reject buttons when editable', () => {
    render(<DiffViewer content={sampleDiff} editable onAccept={vi.fn()} onReject={vi.fn()} />);
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
  });

  it('does not show buttons when not editable', () => {
    render(<DiffViewer content={sampleDiff} />);
    expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument();
  });

  it('calls onAccept when accept clicked', async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    render(<DiffViewer content={sampleDiff} editable onAccept={onAccept} onReject={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /accept/i }));
    expect(onAccept).toHaveBeenCalled();
  });

  it('calls onReject when reject clicked', async () => {
    const user = userEvent.setup();
    const onReject = vi.fn();
    render(<DiffViewer content={sampleDiff} editable onAccept={vi.fn()} onReject={onReject} />);
    await user.click(screen.getByRole('button', { name: /reject/i }));
    expect(onReject).toHaveBeenCalled();
  });

  it('shows accept/reject buttons even when no filename', () => {
    const diffNoFile = '@@ -1,3 +1,3 @@\n-old line\n+new line\n same line';
    render(<DiffViewer content={diffNoFile} editable onAccept={vi.fn()} onReject={vi.fn()} />);
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
  });

  it('shows Edit button when onAcceptEdited is provided', () => {
    render(
      <DiffViewer
        content={sampleDiff}
        editable
        onAccept={vi.fn()}
        onReject={vi.fn()}
        onAcceptEdited={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  it('does not show Edit button when onAcceptEdited is not provided', () => {
    render(<DiffViewer content={sampleDiff} editable onAccept={vi.fn()} onReject={vi.fn()} />);
    // Only Accept and Reject buttons exist, no Edit
    const buttons = screen.getAllByRole('button');
    expect(buttons.every((b) => !b.textContent?.includes('Edit'))).toBe(true);
  });

  it('clicking Edit shows textarea with new content', async () => {
    const user = userEvent.setup();
    render(
      <DiffViewer
        content={sampleDiff}
        editable
        onAccept={vi.fn()}
        onReject={vi.fn()}
        onAcceptEdited={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: /edit/i }));
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue(extractNewContent(sampleDiff));
  });

  it('clicking Apply Edit calls onAcceptEdited with edited content', async () => {
    const user = userEvent.setup();
    const onAcceptEdited = vi.fn();
    render(
      <DiffViewer
        content={sampleDiff}
        editable
        onAccept={vi.fn()}
        onReject={vi.fn()}
        onAcceptEdited={onAcceptEdited}
      />,
    );
    await user.click(screen.getByRole('button', { name: /edit/i }));
    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, 'modified content');
    await user.click(screen.getByRole('button', { name: /apply edit/i }));
    expect(onAcceptEdited).toHaveBeenCalledWith('modified content');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('clicking Cancel exits editing mode', async () => {
    const user = userEvent.setup();
    render(
      <DiffViewer
        content={sampleDiff}
        editable
        onAccept={vi.fn()}
        onReject={vi.fn()}
        onAcceptEdited={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
