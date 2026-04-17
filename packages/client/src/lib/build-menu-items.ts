import { type ChannelFeature, isMenuItemFeature, isSlashCommandFeature } from './feature';
import type { FeatureRegistry } from './feature-registry';

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

interface MenuSections {
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
  localFeatures?: ChannelFeature[];
  close: () => void;
  closeSilent: () => void;
  compose: { executeSlashCommand: (cmd: string) => void };
}

const byOrder = (a: { menuItem: { order?: number } }, b: { menuItem: { order?: number } }) =>
  (a.menuItem.order ?? Number.POSITIVE_INFINITY) - (b.menuItem.order ?? Number.POSITIVE_INFINITY);

export function buildMenuItems(params: BuildMenuItemsParams): MenuSections {
  const { slashCommands, registry } = params;
  const { close, closeSilent, compose } = params;

  const local = params.localFeatures ?? [];
  const menuFeatures = [...registry.getMenuItemFeatures(), ...local.filter(isMenuItemFeature)];
  const menuFeatureIds = new Set(menuFeatures.map((f) => f.id));
  const slashFeatures = [
    ...registry.getSlashCommandFeatures(),
    ...local.filter(isSlashCommandFeature),
  ].filter((f) => f.execute && !menuFeatureIds.has(f.id));

  function buildSection(section: string): MenuItem[] {
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
          f.menuItem.closeSilent ? closeSilent() : close();
        },
      }));
  }

  const context: MenuItem[] = buildSection('Context');

  const model: MenuItem[] = buildSection('Model');

  const customize: MenuItem[] = buildSection('Customize');

  const settings: MenuItem[] = buildSection('Settings');

  const support: MenuItem[] = buildSection('Support');

  const allRegistryCommandIds = new Set(registry.getSlashCommandFeatures().map((f) => f.command));
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
    ...buildSection('Slash Commands'),
    ...registrySlashItems,
    ...cliSlashItems,
  ].sort((a, b) => a.label.localeCompare(b.label));

  return { context, model, customize, slash, settings, support };
}
