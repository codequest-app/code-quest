import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FileViewer, FileViewerConnected } from '../FileViewer';

describe('FileViewer', () => {
  it('renders file content with syntax highlighting', () => {
    render(<FileViewer filePath="src/index.ts" content="const x = 1;" />);
    expect(screen.getByText('src/index.ts')).toBeInTheDocument();
    expect(screen.getByText('typescript')).toBeInTheDocument();
    expect(screen.getByText(/const/)).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<FileViewer filePath="src/index.ts" loading />);
    expect(screen.getByText(/Loading index\.ts/)).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(<FileViewer filePath="missing.ts" error="File not found: missing.ts" />);
    expect(screen.getByText('missing.ts')).toBeInTheDocument();
    expect(screen.getByText(/File not found/)).toBeInTheDocument();
  });

  it('returns null when no content, error, or loading', () => {
    const { container } = render(<FileViewer filePath="foo.ts" />);
    expect(container.innerHTML).toBe('');
  });

  it('detects language from file extension', () => {
    render(<FileViewer filePath="app.py" content="print('hi')" />);
    expect(screen.getByText('python')).toBeInTheDocument();
  });

  it('falls back to text for unknown extension', () => {
    render(<FileViewer filePath="data.xyz" content="hello" />);
    expect(screen.queryByText('xyz')).not.toBeInTheDocument();
  });
});

describe('FileViewerConnected', () => {
  const fakeEmit = (response: Record<string, unknown>) =>
    vi.fn((_event: string, ..._args: unknown[]) => {
      const cb = _args[_args.length - 1];
      if (typeof cb === 'function') cb(response);
    }) as unknown as (event: string, ...args: unknown[]) => void;

  it('fetches file content via emit and renders', async () => {
    const emit = fakeEmit({ content: 'const x = 42;' });

    render(<FileViewerConnected filePath="src/main.ts" emit={emit} />);

    await waitFor(() => {
      expect(screen.getByText(/42/)).toBeInTheDocument();
    });

    expect(emit).toHaveBeenCalledWith(
      'file:read',
      { filePath: 'src/main.ts' },
      expect.any(Function),
    );
  });

  it('renders error from emit response', async () => {
    const emit = fakeEmit({ error: 'File not found: src/nope.ts' });

    render(<FileViewerConnected filePath="src/nope.ts" emit={emit} />);

    await waitFor(() => {
      expect(screen.getByText(/File not found/)).toBeInTheDocument();
    });
  });
});
