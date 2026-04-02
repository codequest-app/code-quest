import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MentionDropdown } from '../MentionDropdown';

const baseProps = {
  mentionQuery: '',
  filteredSuggestions: [],
  searchStatus: 'done' as const,
  selectedIndex: 0,
  hasFileSearch: true,
  onSelectMention: vi.fn(),
};

describe('MentionDropdown', () => {
  it('renders file item with icon + name + directory path', () => {
    render(
      <MentionDropdown
        {...baseProps}
        fileResults={[{ path: 'src/utils/helpers.ts', name: 'helpers.ts', type: 'file' }]}
      />,
    );
    expect(screen.getByText('helpers.ts')).toBeInTheDocument();
    expect(screen.getByText('src/utils/')).toBeInTheDocument();
    // SVG icon should be present
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders directory item with icon + full path', () => {
    render(
      <MentionDropdown
        {...baseProps}
        fileResults={[{ path: 'src/utils/', name: 'utils', type: 'directory' }]}
      />,
    );
    expect(screen.getByText('src/utils/')).toBeInTheDocument();
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders terminal item with icon + name + terminal label', () => {
    render(
      <MentionDropdown
        {...baseProps}
        fileResults={[{ path: 'session-1', name: 'session-1', type: 'terminal' }]}
      />,
    );
    expect(screen.getByText('session-1')).toBeInTheDocument();
    expect(screen.getByText('terminal')).toBeInTheDocument();
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('file item does not show directory path when path equals name', () => {
    render(
      <MentionDropdown
        {...baseProps}
        fileResults={[{ path: 'README.md', name: 'README.md', type: 'file' }]}
      />,
    );
    expect(screen.getByText('README.md')).toBeInTheDocument();
    // No directory path element
    expect(screen.queryByText('/')).not.toBeInTheDocument();
  });
});
