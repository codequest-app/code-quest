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
});
