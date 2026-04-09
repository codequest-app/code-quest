import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../App';

describe('App', () => {
  it('renders WorkspaceLayout without hitting ErrorBoundary — all providers are present', () => {
    render(<App />);

    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('shows only EmptyState when no projects exist — no sidebar or tab bar', () => {
    render(<App />);

    expect(screen.getByTestId('empty-add-project')).toBeInTheDocument();
    expect(screen.queryByTestId('tab-bar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sidebar-panel')).not.toBeInTheDocument();
  });
});
