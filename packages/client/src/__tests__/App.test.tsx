import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../App';

describe('App', () => {
  it('renders WorkspaceLayout without hitting ErrorBoundary — all providers are present', () => {
    render(<App />);

    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('shows EmptyState when no projects exist (no TabBar until project is created)', () => {
    render(<App />);

    expect(screen.getByTestId('empty-new-session')).toBeInTheDocument();
    expect(screen.queryByTestId('tab-bar')).not.toBeInTheDocument();
  });
});
