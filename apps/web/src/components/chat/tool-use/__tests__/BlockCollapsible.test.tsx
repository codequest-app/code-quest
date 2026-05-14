import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useBlockOpenStore } from '@/stores/useBlockOpenStore.ts';
import { BlockCollapsible } from '../BlockCollapsible.tsx';

beforeEach(() => {
  useBlockOpenStore.getState().reset();
});

describe('BlockCollapsible', () => {
  it('starts collapsed by default', () => {
    render(
      <BlockCollapsible blockId="b1" icon="📄" label="Test">
        <span>content</span>
      </BlockCollapsible>,
    );
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('opens when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(
      <BlockCollapsible blockId="b1" icon="📄" label="Test">
        <span>content</span>
      </BlockCollapsible>,
    );
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('closes again when trigger is clicked twice', async () => {
    const user = userEvent.setup();
    render(
      <BlockCollapsible blockId="b1" icon="📄" label="Test">
        <span>content</span>
      </BlockCollapsible>,
    );
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByRole('button'));
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('persists open state across remount', async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <BlockCollapsible blockId="b1" icon="📄" label="Test">
        <span>content</span>
      </BlockCollapsible>,
    );
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('content')).toBeInTheDocument();

    unmount();

    render(
      <BlockCollapsible blockId="b1" icon="📄" label="Test">
        <span>content</span>
      </BlockCollapsible>,
    );
    // still open after remount
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('initialOpen opens the block on first mount', () => {
    render(
      <BlockCollapsible blockId="b-init" initialOpen label="Init">
        <span>init-content</span>
      </BlockCollapsible>,
    );
    expect(screen.getByText('init-content')).toBeInTheDocument();
  });

  it('initialOpen does not override a user-closed state on remount', async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <BlockCollapsible blockId="b-init2" initialOpen label="Init2">
        <span>init-content-2</span>
      </BlockCollapsible>,
    );
    // user closes it
    await user.click(screen.getByRole('button'));
    expect(screen.queryByText('init-content-2')).not.toBeInTheDocument();

    unmount();

    // remount — initialOpen should NOT reopen it (user closed it)
    render(
      <BlockCollapsible blockId="b-init2" initialOpen label="Init2">
        <span>init-content-2</span>
      </BlockCollapsible>,
    );
    expect(screen.queryByText('init-content-2')).not.toBeInTheDocument();
  });

  it('two blocks with different ids have independent open state', async () => {
    const user = userEvent.setup();
    render(
      <>
        <BlockCollapsible blockId="b1" icon="📄" label="Block1">
          <span>content-1</span>
        </BlockCollapsible>
        <BlockCollapsible blockId="b2" icon="📄" label="Block2">
          <span>content-2</span>
        </BlockCollapsible>
      </>,
    );
    await user.click(screen.getAllByRole('button')[0]!);
    expect(screen.getByText('content-1')).toBeInTheDocument();
    expect(screen.queryByText('content-2')).not.toBeInTheDocument();
  });
});
