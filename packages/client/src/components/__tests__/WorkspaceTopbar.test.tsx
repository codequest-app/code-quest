import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WorkspaceTopbar } from '../WorkspaceTopbar';

describe('WorkspaceTopbar', () => {
  it('renders the Settings button with aria-label="Settings"', () => {
    render(
      <WorkspaceTopbar mode="desktop" onOpenSettings={() => {}}>
        <span>content</span>
      </WorkspaceTopbar>,
    );
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });

  it('clicking Settings invokes onOpenSettings', async () => {
    const onOpenSettings = vi.fn();
    render(
      <WorkspaceTopbar mode="desktop" onOpenSettings={onOpenSettings}>
        <span>content</span>
      </WorkspaceTopbar>,
    );
    await userEvent.setup().click(screen.getByRole('button', { name: /settings/i }));
    expect(onOpenSettings).toHaveBeenCalled();
  });

  it('renders a hamburger (aria-label="Menu") when onOpenMenu is provided', async () => {
    const onOpenMenu = vi.fn();
    render(
      <WorkspaceTopbar mode="desktop" onOpenSettings={() => {}} onOpenMenu={onOpenMenu}>
        <span>content</span>
      </WorkspaceTopbar>,
    );
    const menu = screen.getByRole('button', { name: /menu/i });
    await userEvent.setup().click(menu);
    expect(onOpenMenu).toHaveBeenCalled();
  });

  it('does NOT render a hamburger when onOpenMenu is omitted', () => {
    render(
      <WorkspaceTopbar mode="desktop" onOpenSettings={() => {}}>
        <span>content</span>
      </WorkspaceTopbar>,
    );
    expect(screen.queryByRole('button', { name: /menu/i })).toBeNull();
  });

  it('forwards testId to the root element data-testid attribute', () => {
    const { rerender } = render(
      <WorkspaceTopbar mode="desktop" onOpenSettings={() => {}}>
        <span>content</span>
      </WorkspaceTopbar>,
    );
    expect(screen.getByTestId('desktop-topbar')).toBeInTheDocument();
    rerender(
      <WorkspaceTopbar mode="mobile" onOpenSettings={() => {}}>
        <span>content</span>
      </WorkspaceTopbar>,
    );
    expect(screen.getByTestId('mobile-topbar')).toBeInTheDocument();
  });

  it('order (left → right): hamburger, children, Settings', () => {
    render(
      <WorkspaceTopbar mode="desktop" onOpenSettings={() => {}} onOpenMenu={() => {}}>
        <span data-testid="slot-content">content</span>
      </WorkspaceTopbar>,
    );
    const root = screen.getByTestId('desktop-topbar');
    const hamburger = screen.getByRole('button', { name: /menu/i });
    const content = screen.getByTestId('slot-content');
    const settings = screen.getByRole('button', { name: /settings/i });
    const children = Array.from(root.children);
    // Position check via DOM order — hamburger first, content somewhere after, settings last.
    expect(children.indexOf(hamburger)).toBeLessThan(children.indexOf(content));
    expect(children.indexOf(content)).toBeLessThan(children.indexOf(settings));
  });
});
