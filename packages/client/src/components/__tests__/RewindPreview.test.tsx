import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { RewindPreview } from '../RewindPreview';

describe('RewindPreview', () => {
  it('shows "modified" badge when both oldContent and newContent exist', () => {
    render(
      <RewindPreview
        data={{
          fileDiffs: {
            'src/index.ts': { oldContent: 'old code', newContent: 'new code' },
          },
        }}
      />,
    );
    expect(screen.getByText('modified')).toBeInTheDocument();
    expect(screen.getByText('src/index.ts')).toBeInTheDocument();
  });

  it('shows "added" badge when oldContent is null', () => {
    render(
      <RewindPreview
        data={{
          fileDiffs: {
            'src/new.ts': { oldContent: null, newContent: 'content' },
          },
        }}
      />,
    );
    expect(screen.getByText('added')).toBeInTheDocument();
  });

  it('shows "deleted" badge when newContent is null', () => {
    render(
      <RewindPreview
        data={{
          fileDiffs: {
            'src/old.ts': { oldContent: 'content', newContent: null },
          },
        }}
      />,
    );
    expect(screen.getByText('deleted')).toBeInTheDocument();
  });

  it('expands details to show old/new content', async () => {
    const user = userEvent.setup();
    render(
      <RewindPreview
        data={{
          fileDiffs: {
            'src/index.ts': { oldContent: 'old code', newContent: 'new code' },
          },
        }}
      />,
    );

    // Click to expand the file entry
    await user.click(screen.getByText('src/index.ts'));

    // Old and new content summaries should appear
    expect(screen.getByText('Old content')).toBeInTheDocument();
    expect(screen.getByText('New content')).toBeInTheDocument();
  });

  it('falls back to JsonViewer when no fileDiffs', () => {
    render(<RewindPreview data={{ message: 'no diffs here' }} />);
    // Should render JSON content (JsonViewer)
    expect(screen.getByText(/no diffs here/)).toBeInTheDocument();
  });
});
