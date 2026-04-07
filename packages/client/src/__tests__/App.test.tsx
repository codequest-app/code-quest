import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../App';

describe('App', () => {
  it('renders WorkspaceLayout without hitting ErrorBoundary — all providers are present', () => {
    // This test renders the REAL App component with its actual provider hierarchy.
    // If App.tsx is missing SessionProvider or TabProvider, WorkspaceLayout will throw
    // "useTabState must be used within a TabProvider" and ErrorBoundary will render
    // the ErrorFallback with "Something went wrong".
    render(<App />);

    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('renders exactly one TabBar (no duplicate from TabProvider + WorkspaceLayout)', () => {
    render(<App />);

    const tabBars = screen.getAllByTestId('tab-bar');
    expect(tabBars).toHaveLength(1);
  });
});
