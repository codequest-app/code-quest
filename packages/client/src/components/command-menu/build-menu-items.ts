import { renderMenuTrailing } from '../../lib/adapters/to-menu-item';
import type { Feature, FeatureSection } from '../../lib/feature';
import type { FeatureRegistry } from '../../lib/feature-registry';

export type DismissBehavior = 'close' | 'closeSilent' | 'none';

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
  dismissBehavior?: DismissBehavior;
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
  compose: { executeSlashCommand: (cmd: string) => void };
}

const byOrder = (a: Feature, b: Feature) =>
  (a.order ?? Number.POSITIVE_INFINITY) - (b.order ?? Number.POSITIVE_INFINITY);

function featureToMenuItem(f: Feature): MenuItem {
  const isToggle = f.state?.kind === 'toggle';
  return {
    id: f.id,
    label: f.label,
    description: f.description,
    section: f.section,
    disabled: f.disabled,
    filterOnly: f.ui?.filterOnly,
    matchFirstToken: f.ui?.matchFirstToken,
    trailing: renderMenuTrailing(f.state, { featureId: f.id }),
    dismissBehavior: isToggle ? 'none' : f.ui?.closeSilent ? 'closeSilent' : 'close',
    onClick: () => f.execute(),
  };
}

function buildSection(features: Feature[], section: FeatureSection): MenuItem[] {
  return features
    .filter((f) => f.section === section)
    .sort(byOrder)
    .map((f) => featureToMenuItem(f));
}

export function buildMenuItems(params: BuildMenuItemsParams): MenuSections {
  const { slashCommands, registry, compose } = params;

  const local = params.localFeatures ?? [];
  const featureById = new Map<string, Feature>();
  for (const f of registry.getFeatures()) featureById.set(f.id, f);
  for (const f of local) featureById.set(f.id, f);
  const features = [...featureById.values()];

  const section = (name: FeatureSection) => buildSection(features, name);

  const context = section('Context');
  const model = section('Model');
  const customize = section('Customize');
  const settings = section('Settings');
  const support = section('Support');

  const registrySlashCommands = new Set(
    features.flatMap((f) => (f.slash?.command ? [f.slash.command] : [])),
  );
  const cliSlashItems: MenuItem[] = slashCommands
    .filter((cmd) => !registrySlashCommands.has(`/${cmd}`))
    .map((cmd) => ({
      id: `slash-${cmd}`,
      label: `/${cmd}`,
      section: 'Slash Commands',
      dismissBehavior: 'close' as const,
      onClick: () => compose.executeSlashCommand(`/${cmd}`),
    }));

  const slash: MenuItem[] = [...section('Slash Commands'), ...cliSlashItems].sort((a, b) =>
    a.label.localeCompare(b.label),
  );

  return { context, model, customize, slash, settings, support };
}
