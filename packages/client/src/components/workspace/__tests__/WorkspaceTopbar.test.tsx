import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WorkspaceTopbar } from '../WorkspaceTopbar.tsx';

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

  it('renders a left trigger (aria-label="Toggle sidebar") when onToggleLeft is provided', async () => {
    const onToggleLeft = vi.fn();
    render(
      <WorkspaceTopbar mode="desktop" onOpenSettings={() => {}} onToggleLeft={onToggleLeft}>
        <span>content</span>
      </WorkspaceTopbar>,
    );
    const btn = screen.getByRole('button', { name: /toggle sidebar/i });
    await userEvent.setup().click(btn);
    expect(onToggleLeft).toHaveBeenCalled();
  });

  it('renders a right trigger (aria-label="Toggle right pane") when onToggleRight is provided', async () => {
    const onToggleRight = vi.fn();
    render(
      <WorkspaceTopbar mode="desktop" onOpenSettings={() => {}} onToggleRight={onToggleRight}>
        <span>content</span>
      </WorkspaceTopbar>,
    );
    const btn = screen.getByRole('button', { name: /toggle right pane/i });
    await userEvent.setup().click(btn);
    expect(onToggleRight).toHaveBeenCalled();
  });

  it('omits left trigger when onToggleLeft not provided', () => {
    render(
      <WorkspaceTopbar mode="desktop" onOpenSettings={() => {}}>
        <span>content</span>
      </WorkspaceTopbar>,
    );
    expect(screen.queryByRole('button', { name: /toggle sidebar/i })).toBeNull();
  });

  it('omits right trigger when onToggleRight not provided', () => {
    render(
      <WorkspaceTopbar mode="desktop" onOpenSettings={() => {}}>
        <span>content</span>
      </WorkspaceTopbar>,
    );
    expect(screen.queryByRole('button', { name: /toggle right pane/i })).toBeNull();
  });

  it('forwards mode to the root aria-label attribute', () => {
    const { rerender } = render(
      <WorkspaceTopbar mode="desktop" onOpenSettings={() => {}}>
        <span>content</span>
      </WorkspaceTopbar>,
    );
    expect(screen.getByLabelText('desktop-topbar')).toBeInTheDocument();
    rerender(
      <WorkspaceTopbar mode="mobile" onOpenSettings={() => {}}>
        <span>content</span>
      </WorkspaceTopbar>,
    );
    expect(screen.getByLabelText('mobile-topbar')).toBeInTheDocument();
  });

  it('renders Search button when onOpenSearch is provided', async () => {
    const onOpenSearch = vi.fn();
    render(
      <WorkspaceTopbar mode="desktop" onOpenSettings={() => {}} onOpenSearch={onOpenSearch}>
        <span>content</span>
      </WorkspaceTopbar>,
    );
    const btn = screen.getByRole('button', { name: /search/i });
    await userEvent.setup().click(btn);
    expect(onOpenSearch).toHaveBeenCalledOnce();
  });

  it('order (left → right): leftTrigger, children, rightTrigger, Search, Settings', () => {
    render(
      <WorkspaceTopbar
        mode="desktop"
        onOpenSettings={() => {}}
        onOpenSearch={() => {}}
        onToggleLeft={() => {}}
        onToggleRight={() => {}}
      >
        <span>content</span>
      </WorkspaceTopbar>,
    );
    const root = screen.getByLabelText('desktop-topbar');
    const left = screen.getByRole('button', { name: /toggle sidebar/i });
    const content = screen.getByText('content');
    const right = screen.getByRole('button', { name: /toggle right pane/i });
    const search = screen.getByRole('button', { name: /search/i });
    const settings = screen.getByRole('button', { name: /settings/i });
    const indexOf = (el: Element) => Array.from(root.children).indexOf(el as HTMLElement);
    expect(indexOf(left)).toBeLessThan(indexOf(content));
    expect(indexOf(content)).toBeLessThan(indexOf(right));
    expect(indexOf(right)).toBeLessThan(indexOf(search));
    expect(indexOf(search)).toBeLessThan(indexOf(settings));
  });
});
