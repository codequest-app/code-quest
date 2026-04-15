import { segments as s } from '@code-quest/summoner/test';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithChannel } from '../../test/render-with-channel';
import { CommandMenu } from '../CommandMenu';

const defaultControlResponse = s.controlResponse('init', {
  models: [{ value: 'claude-sonnet-4-6', displayName: 'Sonnet 4.6' }],
});

async function renderCommandMenu(
  props: Partial<React.ComponentProps<typeof CommandMenu>> = {},
  initOpts?: Parameters<typeof s.init>[1],
) {
  return renderWithChannel(<CommandMenu {...props} />, {
    initSegment: s.init('sess-1', initOpts),
    extraSegments: [defaultControlResponse],
  });
}

describe('CommandMenu', () => {
  it('renders / command menu button', async () => {
    await renderCommandMenu();
    expect(screen.getByTitle('Show command menu (/)')).toBeInTheDocument();
  });

  it('reads slashCommands from context and shows them in menu', async () => {
    await renderCommandMenu({}, { slashCommands: ['compact', 'cost'] });
    await userEvent.click(screen.getByTitle('Show command menu (/)'));
    expect(screen.getByText('/compact')).toBeInTheDocument();
    expect(screen.getByText('/cost')).toBeInTheDocument();
  });

  it('reads effort from context and shows Effort item', async () => {
    await renderCommandMenu();
    await userEvent.click(screen.getByTitle('Show command menu (/)'));
    expect(screen.getByText('Effort')).toBeInTheDocument();
  });

  it('calls onOpenModelPicker prop when Switch model clicked', async () => {
    const onOpenModelPicker = vi.fn();
    await renderCommandMenu({ onOpenModelPicker });
    await userEvent.click(screen.getByTitle('Show command menu (/)'));
    await userEvent.click(screen.getByText('Switch model'));
    expect(onOpenModelPicker).toHaveBeenCalled();
  });

  it('only accepts dialog callback props — no modelLabel/effort/slashCommands props', async () => {
    await renderCommandMenu({}, { slashCommands: ['test'] });
    // No error — context provides the data
  });

  describe('filter input visibility', () => {
    it('shows filter input when opened via button', async () => {
      await renderCommandMenu();
      await userEvent.click(screen.getByTitle('Show command menu (/)'));
      expect(screen.getByPlaceholderText('Filter actions...')).toBeInTheDocument();
    });
  });

  describe('semantic HTML / a11y roles', () => {
    it('popup container has role="menu"', async () => {
      await renderCommandMenu();
      await userEvent.click(screen.getByTitle('Show command menu (/)'));
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('each action button has role="menuitem"', async () => {
      await renderCommandMenu();
      await userEvent.click(screen.getByTitle('Show command menu (/)'));
      const items = screen.getAllByRole('menuitem');
      expect(items.length).toBeGreaterThan(0);
    });

    it('each section is a role="group" with aria-label', async () => {
      await renderCommandMenu({}, { slashCommands: ['compact'] });
      await userEvent.click(screen.getByTitle('Show command menu (/)'));
      // At least one group should exist (e.g. "Slash commands" section)
      const groups = screen.getAllByRole('group');
      expect(groups.length).toBeGreaterThan(0);
      for (const g of groups) {
        expect(g).toHaveAttribute('aria-label');
      }
    });
  });
});
