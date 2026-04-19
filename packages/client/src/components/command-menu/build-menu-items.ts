import { toMenuItem } from '../../lib/adapters/to-menu-item';
import { toSlashCommand } from '../../lib/adapters/to-slash-command';
import type { Feature, FeatureSection, MenuItemView, SlashCommandView } from '../../lib/feature';
import type { FeatureRegistry } from '../../lib/feature-registry';

export interface MenuItem {
  id: string;
  label: string;
  description?: string;
  section: string;
  disabled?: boolean;
  filterOnly?: boolean;
  /** Match only the first word of the filter text (e.g. "/btw <question>" → match on "btw") */
  matchFirstToken?: boolean;
  trailing?: React.ReactNode;
  onClick?: () => void;
}

export interface MenuSections {
  context: MenuItem[];
  model: MenuItem[];
  customize: MenuItem[];
  slash: MenuItem[];
  settings: MenuItem[];
  support: MenuItem[];
}

export interface BuildMenuItemsParams {
  slashCommands: string[];
  registry: FeatureRegistry;
  localFeatures?: Feature[];
  close: () => void;
  closeSilent: () => void;
  compose: { executeSlashCommand: (cmd: string) => void };
}

const byOrder = (a: { menuItem: { order?: number } }, b: { menuItem: { order?: number } }) =>
  (a.menuItem.order ?? Number.POSITIVE_INFINITY) - (b.menuItem.order ?? Number.POSITIVE_INFINITY);

function buildSection(
  menuFeatures: MenuItemView[],
  section: FeatureSection,
  onClose: { close: () => void; closeSilent: () => void },
): MenuItem[] {
  return menuFeatures
    .filter((f) => f.menuItem.section === section)
    .sort(byOrder)
    .map((f) => ({
      id: f.id,
      label: f.menuItem.label,
      description: f.menuItem.description,
      section,
      disabled: f.menuItem.disabled,
      filterOnly: f.menuItem.filterOnly,
      matchFirstToken: f.menuItem.matchFirstToken,
      trailing: f.menuItem.trailing,
      onClick: () => {
        f.execute();
        f.menuItem.closeSilent ? onClose.closeSilent() : onClose.close();
      },
    }));
}

export function buildMenuItems(params: BuildMenuItemsParams): MenuSections {
  const { slashCommands, registry } = params;
  const { close, closeSilent, compose } = params;

  const local = params.localFeatures ?? [];
  // Local features override registry entries with the same id (e.g. btw: registry
  // has the base Feature; CommandMenu adds a per-render wrapper that knows the
  // live slashFilter state).
  const menuFeatureById = new Map<string, MenuItemView>();
  for (const f of registry.getMenuItemViews()) menuFeatureById.set(f.id, f);
  for (const f of local) menuFeatureById.set(f.id, toMenuItem(f));
  const menuFeatures = [...menuFeatureById.values()];
  const menuFeatureIds = new Set(menuFeatureById.keys());

  const slashFeatureById = new Map<string, SlashCommandView>();
  for (const f of registry.getSlashCommandViews()) slashFeatureById.set(f.id, f);
  for (const f of local) {
    const slash = toSlashCommand(f);
    if (slash) slashFeatureById.set(f.id, slash);
  }
  const slashFeatures = [...slashFeatureById.values()].filter(
    (f) => f.execute && !menuFeatureIds.has(f.id),
  );

  const section = (name: FeatureSection) =>
    buildSection(menuFeatures, name, { close, closeSilent });

  const context: MenuItem[] = section('Context');

  const model: MenuItem[] = section('Model');

  const customize: MenuItem[] = section('Customize');

  const settings: MenuItem[] = section('Settings');

  const support: MenuItem[] = section('Support');

  const allRegistryCommandIds = new Set(registry.getSlashCommandViews().map((f) => f.command));
  const filteredCliCommands = slashCommands.filter((cmd) => !allRegistryCommandIds.has(`/${cmd}`));

  function toRegistrySlashItem(f: (typeof slashFeatures)[number]): MenuItem {
    return {
      id: f.id,
      label: f.command,
      section: 'Slash Commands',
      onClick: () => {
        f.execute?.();
        close();
      },
    };
  }

  function toCliSlashItem(cmd: string): MenuItem {
    return {
      id: `slash-${cmd}`,
      label: `/${cmd}`,
      section: 'Slash Commands',
      onClick: () => {
        compose.executeSlashCommand(`/${cmd}`);
        close();
      },
    };
  }

  const registrySlashItems: MenuItem[] = slashFeatures.map(toRegistrySlashItem);
  const cliSlashItems: MenuItem[] = filteredCliCommands.map(toCliSlashItem);

  const slash: MenuItem[] = [
    ...section('Slash Commands'),
    ...registrySlashItems,
    ...cliSlashItems,
  ].sort((a, b) => a.label.localeCompare(b.label));

  return { context, model, customize, slash, settings, support };
}
