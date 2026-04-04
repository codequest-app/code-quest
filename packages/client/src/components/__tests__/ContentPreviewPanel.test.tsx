import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ContentPreviewPanel } from '../ContentPreviewPanel';

describe('ContentPreviewPanel', () => {
  it('render title', () => {
    render(<ContentPreviewPanel content="test" title="My Preview" onClose={vi.fn()} />);
    expect(screen.getByText('My Preview')).toBeInTheDocument();
  });

  it('render content', () => {
    render(<ContentPreviewPanel content="Hello world" onClose={vi.fn()} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('call onClose when close button clicked', async () => {
    const onClose = vi.fn();
    render(<ContentPreviewPanel content="test" onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('render without title', () => {
    render(<ContentPreviewPanel content="no title" onClose={vi.fn()} />);
    expect(screen.getByText('no title')).toBeInTheDocument();
  });

  it('render markdown content when no diffs provided', () => {
    render(<ContentPreviewPanel content="# Heading" onClose={vi.fn()} />);
    expect(screen.getByText('Heading')).toBeInTheDocument();
  });

  it('render DiffViewer for each diff entry when diffs provided', () => {
    const diffs = [
      { filePath: 'src/foo.ts', oldContent: 'old foo', newContent: 'new foo' },
      { filePath: 'src/bar.ts', oldContent: 'old bar', newContent: 'new bar' },
    ];
    render(<ContentPreviewPanel content="" diffs={diffs} onClose={vi.fn()} />);
    const filenames = screen.getAllByTestId('diff-filename');
    expect(filenames).toHaveLength(2);
  });

  it('show file paths in diff headers', () => {
    const diffs = [{ filePath: 'src/hello.ts', oldContent: 'a', newContent: 'b' }];
    render(<ContentPreviewPanel content="" diffs={diffs} onClose={vi.fn()} />);
    expect(screen.getByText('src/hello.ts')).toBeInTheDocument();
  });

  it('renders as modal overlay with backdrop', () => {
    render(<ContentPreviewPanel content="test" onClose={vi.fn()} />);
    expect(screen.getByTestId('modal-backdrop')).toBeInTheDocument();
  });

  it('closes on backdrop click', async () => {
    const onClose = vi.fn();
    render(<ContentPreviewPanel content="test" onClose={onClose} />);
    await userEvent.click(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape key', async () => {
    const onClose = vi.fn();
    render(<ContentPreviewPanel content="test" onClose={onClose} />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
