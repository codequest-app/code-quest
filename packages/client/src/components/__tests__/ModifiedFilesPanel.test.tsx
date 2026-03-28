import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ModifiedFilesPanel } from '../ModifiedFilesPanel';

const sampleFiles = [
  { path: 'src/utils/helper.ts', status: 'modified', oldContent: 'old1', newContent: 'new1' },
  { path: 'src/index.ts', status: 'added', newContent: 'new file' },
  { path: 'src/legacy.ts', status: 'deleted', oldContent: 'removed' },
];

describe('ModifiedFilesPanel', () => {
  it('renders list of modified files', () => {
    render(<ModifiedFilesPanel files={sampleFiles} onAccept={vi.fn()} onRewind={vi.fn()} />);
    expect(screen.getByText('src/utils/helper.ts')).toBeInTheDocument();
    expect(screen.getByText('src/index.ts')).toBeInTheDocument();
    expect(screen.getByText('src/legacy.ts')).toBeInTheDocument();
  });

  it('expands file to show diff on click', async () => {
    const user = userEvent.setup();
    render(<ModifiedFilesPanel files={sampleFiles} onAccept={vi.fn()} onRewind={vi.fn()} />);
    await user.click(screen.getAllByText('src/utils/helper.ts')[0]);
    expect(screen.getByText(/old1/)).toBeInTheDocument();
    expect(screen.getByText(/new1/)).toBeInTheDocument();
  });

  it('collapses expanded file on second click', async () => {
    const user = userEvent.setup();
    render(<ModifiedFilesPanel files={sampleFiles} onAccept={vi.fn()} onRewind={vi.fn()} />);
    await user.click(screen.getAllByText('src/utils/helper.ts')[0]);
    expect(screen.getByText(/old1/)).toBeInTheDocument();
    await user.click(screen.getAllByText('src/utils/helper.ts')[0]);
    expect(screen.queryByText(/old1/)).not.toBeInTheDocument();
  });

  it('calls onAccept with file path', async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    render(<ModifiedFilesPanel files={sampleFiles} onAccept={onAccept} onRewind={vi.fn()} />);
    await user.click(screen.getAllByText('src/utils/helper.ts')[0]);
    await user.click(screen.getAllByRole('button', { name: /accept/i })[0]);
    expect(onAccept).toHaveBeenCalledWith('src/utils/helper.ts');
  });

  it('calls onRewind with file path', async () => {
    const user = userEvent.setup();
    const onRewind = vi.fn();
    render(<ModifiedFilesPanel files={sampleFiles} onAccept={vi.fn()} onRewind={onRewind} />);
    await user.click(screen.getAllByText('src/utils/helper.ts')[0]);
    await user.click(screen.getAllByRole('button', { name: /rewind/i })[0]);
    expect(onRewind).toHaveBeenCalledWith('src/utils/helper.ts');
  });

  it('show version count badge for files with multiple snapshots', () => {
    const fileSnapshots = [
      {
        messageId: 'msg-1',
        filePath: 'src/utils/helper.ts',
        oldContent: 'v1',
        newContent: 'v2',
        timestamp: 1,
      },
      {
        messageId: 'msg-2',
        filePath: 'src/utils/helper.ts',
        oldContent: 'v2',
        newContent: 'v3',
        timestamp: 2,
      },
      {
        messageId: 'msg-3',
        filePath: 'src/utils/helper.ts',
        oldContent: 'v3',
        newContent: 'v4',
        timestamp: 3,
      },
    ];
    render(
      <ModifiedFilesPanel
        files={sampleFiles}
        fileSnapshots={fileSnapshots}
        onAccept={vi.fn()}
        onRewind={vi.fn()}
      />,
    );
    expect(screen.getByText('3 versions')).toBeInTheDocument();
  });

  it('not show version badge when only 1 snapshot', () => {
    const fileSnapshots = [
      {
        messageId: 'msg-1',
        filePath: 'src/utils/helper.ts',
        oldContent: 'v1',
        newContent: 'v2',
        timestamp: 1,
      },
    ];
    render(
      <ModifiedFilesPanel
        files={sampleFiles}
        fileSnapshots={fileSnapshots}
        onAccept={vi.fn()}
        onRewind={vi.fn()}
      />,
    );
    expect(screen.queryByText(/versions/)).not.toBeInTheDocument();
  });

  it('renders DiffViewer when file has both old and new content', async () => {
    const user = userEvent.setup();
    render(<ModifiedFilesPanel files={sampleFiles} onAccept={vi.fn()} onRewind={vi.fn()} />);
    await user.click(screen.getAllByText('src/utils/helper.ts')[0]);
    // DiffViewer renders a unified diff with @@ hunk headers
    expect(screen.getByText(/@@/)).toBeInTheDocument();
  });

  it('renders simple display for added-only file', async () => {
    const user = userEvent.setup();
    render(<ModifiedFilesPanel files={sampleFiles} onAccept={vi.fn()} onRewind={vi.fn()} />);
    await user.click(screen.getByText('src/index.ts'));
    expect(screen.getByText('+ new file')).toBeInTheDocument();
  });

  it('shows status indicator colors', () => {
    render(<ModifiedFilesPanel files={sampleFiles} onAccept={vi.fn()} onRewind={vi.fn()} />);
    const added = screen.getByTestId('status-src/index.ts');
    const modified = screen.getByTestId('status-src/utils/helper.ts');
    const deleted = screen.getByTestId('status-src/legacy.ts');
    expect(added.className).toMatch(/success/);
    expect(modified.className).toMatch(/warning/);
    expect(deleted.className).toMatch(/danger/);
  });
});
