import { type EffortLevel, effortLevelSchema } from '@code-quest/shared';
import { type ChannelFeature, isMenuItemFeature, isSlashCommandFeature } from '../lib/feature';
import type { FeatureRegistry } from '../lib/feature-registry';
import { EffortSwitch } from './icons/EffortSwitch';
import { ToggleSwitch } from './ui/ToggleSwitch';

export interface MenuItem {
  id: string;
  label: string;
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
  tools: MenuItem[];
  slash: MenuItem[];
  settings: MenuItem[];
  support: MenuItem[];
}

export interface BuildMenuItemsParams {
  slashCommands: string[];
  slashFilter: string | null;
  effort: EffortLevel | null;
  effortLevels: EffortLevel[];
  isThinkingOn: boolean;
  isFastMode: boolean;
  fastModeState: 'on' | 'off' | null;
  modelLabel: string;
  supportsFastMode: boolean;
  registry: FeatureRegistry;
  localFeatures?: ChannelFeature[];
  onSetEffort: (effort: string) => void;
  onSetThinkingLevel: (level: string) => void;
  setFastMode: (enabled: boolean) => void;
  close: () => void;
  closeSilent: () => void;
  compose: { executeSlashCommand: (cmd: string) => void };
}

export const DEFAULT_EFFORT_LEVELS: EffortLevel[] = effortLevelSchema.options;

export function buildMenuItems(params: BuildMenuItemsParams): MenuSections {
  const {
    slashCommands,
    slashFilter,
    effort,
    effortLevels,
    isThinkingOn,
    isFastMode,
    fastModeState,
    modelLabel,
    supportsFastMode,
    registry,
  } = params;
  const { onSetEffort, onSetThinkingLevel, setFastMode, close, closeSilent, compose } = params;

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
      .sort(
        (a, b) =>
          (a.menuItem.order ?? Number.POSITIVE_INFINITY) -
          (b.menuItem.order ?? Number.POSITIVE_INFINITY),
      )
      .map((f) => ({
        id: f.id,
        label: f.menuItem.label,
        section,
        filterOnly: f.menuItem.filterOnly,
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
      section: 'Model',
      trailing:
        f.id === 'model' ? (
          <span className="font-mono text-[11px] text-text-muted">{modelLabel}</span>
        ) : undefined,
      onClick: () => {
        f.execute();
        closeSilent();
      },
    };
  }

  const modelRegistryFeatures = menuFeatures.filter((f) => f.menuItem.section === 'Model');
  const modelFeaturesAbove = modelRegistryFeatures
    .filter((f) => (f.menuItem.order ?? Number.POSITIVE_INFINITY) < 50)
    .sort((a, b) => (a.menuItem.order ?? 0) - (b.menuItem.order ?? 0))
    .map(toModelItem);
  const modelFeaturesBelow = modelRegistryFeatures
    .filter((f) => (f.menuItem.order ?? Number.POSITIVE_INFINITY) >= 50)
    .map(toModelItem);

  const model: MenuItem[] = [
    ...modelFeaturesAbove,
    {
      id: 'effort-level',
      label: effort ? `Effort (${effort.charAt(0).toUpperCase()}${effort.slice(1)})` : 'Effort',
      section: 'Model',
      trailing: (
        <EffortSwitch level={effort ?? undefined} levels={effortLevels} onSelect={onSetEffort} />
      ),
      onClick: () => {
        if (effortLevels.length === 0) return;
        const idx = effort ? effortLevels.indexOf(effort) : -1;
        onSetEffort(effortLevels[(idx + 1) % effortLevels.length]);
      },
    },
    {
      id: 'toggle-thinking',
      label: 'Thinking',
      section: 'Model',
      trailing: <ToggleSwitch isOn={isThinkingOn} />,
      onClick: () => onSetThinkingLevel(isThinkingOn ? 'off' : 'default_on'),
    },
    ...modelFeaturesBelow,
    ...(supportsFastMode
      ? [
          {
            id: 'fast-mode',
            label: 'Toggle fast mode',
            section: 'Model',
            trailing: <ToggleSwitch isOn={isFastMode} />,
            onClick: () => setFastMode(fastModeState === 'off' || !fastModeState),
          },
        ]
      : []),
  ];

  const customize: MenuItem[] = buildSection('Customize');

  const tools: MenuItem[] = [];

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

  return { context, model, customize, tools, slash, settings, support };
}
