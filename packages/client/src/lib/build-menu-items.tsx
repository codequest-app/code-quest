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
  slashFilter: string | null;
  modelLabel: string;
  registry: FeatureRegistry;
  localFeatures?: ChannelFeature[];
  close: () => void;
  closeSilent: () => void;
  compose: { executeSlashCommand: (cmd: string) => void };
}

const byOrder = (a: { menuItem: { order?: number } }, b: { menuItem: { order?: number } }) =>
  (a.menuItem.order ?? Number.POSITIVE_INFINITY) - (b.menuItem.order ?? Number.POSITIVE_INFINITY);

export function buildMenuItems(params: BuildMenuItemsParams): MenuSections {
  const { slashCommands, slashFilter, modelLabel, registry } = params;
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
        filterOnly: f.menuItem.filterOnly,
        trailing: f.menuItem.trailing,
        onClick: () => {
          f.execute();
          f.menuItem.closeSilent ? closeSilent() : close();
        },
      }));
  }

  const context: MenuItem[] = buildSection('Context');

  function toModelItem(f: (typeof menuFeatures)[number]): MenuItem {
    return {
      id: f.id,
      label: f.menuItem.label,
      description: f.menuItem.description,
      section: 'Model',
      trailing:
        f.id === 'model' ? (
          <span className="font-mono text-[11px] text-text-muted">{modelLabel}</span>
        ) : (
          f.menuItem.trailing
        ),
      onClick: () => {
        f.execute();
        closeSilent();
      },
    };
  }

  const modelFeatures = menuFeatures.filter((f) => f.menuItem.section === 'Model');
  const model: MenuItem[] = modelFeatures.sort(byOrder).map(toModelItem);

  const customize: MenuItem[] = buildSection('Customize');

  const settings: MenuItem[] = buildSection('Settings');

  const support: MenuItem[] = buildSection('Support');

  const btwQuestion = slashFilter?.startsWith('btw ') ? slashFilter.slice(4).trim() : null;
  const btwFeature = registry.getSlashCommand('/btw');
  const btwItem: MenuItem = {
    id: 'btw',
    label: '/btw',
    section: 'Slash Commands',
    disabled: !btwQuestion,
    matchFirstToken: true,
    onClick: () => {
      if (btwQuestion) {
        btwFeature?.invoke(`/btw ${btwQuestion}`);
        close();
      }
    },
  };

  const allRegistryCommandIds = new Set(registry.getSlashCommandFeatures().map((f) => f.command));
  const filteredCliCommands = slashCommands.filter((cmd) => !allRegistryCommandIds.has(`/${cmd}`));

  const registrySlashItems: MenuItem[] = slashFeatures.map((f) => ({
    id: f.id,
    label: f.command,
    section: 'Slash Commands',
    onClick: () => {
      f.execute?.();
      close();
    },
  }));

  const cliSlashItems: MenuItem[] = filteredCliCommands.map((cmd) => ({
    id: `slash-${cmd}`,
    label: `/${cmd}`,
    section: 'Slash Commands',
    onClick: () => {
      compose.executeSlashCommand(`/${cmd}`);
      close();
    },
  }));

  const slash: MenuItem[] = [...registrySlashItems, btwItem, ...cliSlashItems].sort((a, b) =>
    a.label.localeCompare(b.label),
  );

  return { context, model, customize, slash, settings, support };
}
