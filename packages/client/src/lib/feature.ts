export interface ChannelFeature {
  id: string;
}

export interface SlashCommandFeature extends ChannelFeature {
  command: string;
  match?(message: string): boolean;
  invoke(message: string): void;
  execute?(): void;
}

export interface MenuItemFeature extends ChannelFeature {
  menuItem: {
    label: string;
    section: string;
    /** Lower order = closer to top within the section. Defaults to Infinity. */
    order?: number;
    /** Use closeSilent instead of close after execute (default: false) */
    closeSilent?: boolean;
    /** Show only when filtering, not in the default open menu */
    filterOnly?: boolean;
    description?: string;
    trailing?: React.ReactNode;
    disabled?: boolean;
    matchFirstToken?: boolean;
  };
  execute(): void;
}

/** New unified feature shape — capability as pure data, adapted per UI surface. */
export interface Feature extends ChannelFeature {
  label: string;
  /** Visual grouping — CommandMenu block AND CommandPalette in-tab header. */
  section: FeatureSection;
  /**
   * CommandPalette-specific: which tabs this feature appears in. Undefined
   * defaults to `['all']`. CommandMenu ignores this field.
   */
  tabs?: readonly PaletteTab[];
  order?: number;
  description?: string;
  disabled?: boolean;
  state?: FeatureState;
  execute(): void;
  /** Optional slash command binding — feature is also invokable via `/command`. */
  slash?: {
    command: string;
    match?(message: string): boolean;
    invoke(message: string): void;
  };
  /** UI-level overrides for rare cases. Adapters infer reasonable defaults from `state`. */
  ui?: {
    closeSilent?: boolean;
    matchFirstToken?: boolean;
    filterOnly?: boolean;
  };
}

export const PALETTE_TABS = ['all', 'actions'] as const;
export type PaletteTab = (typeof PALETTE_TABS)[number];

/**
 * Canonical section values. Every Feature declares which UX block it
 * belongs to via `section` (CommandMenu's grouping, CommandPalette's
 * in-tab header). Listing here ensures typos become compile errors at
 * factories, adapters, and consumers.
 */
export const FEATURE_SECTIONS = [
  'Context',
  'Model',
  'Customize',
  'Settings',
  'Support',
  'Filters',
  'Panels',
  'Slash Commands',
] as const;
export type FeatureSection = (typeof FEATURE_SECTIONS)[number];

/** Collapse a set of toggleable items into a tri-state aggregate.
 *  Shared by renderMenuTrailing / renderPaletteTrailing / FeatureRow so the
 *  same derivation can't drift. */
export function deriveGroupAggregate(
  items: ReadonlyArray<{ on: boolean }>,
): 'all' | 'partial' | 'none' {
  const onCount = items.filter((i) => i.on).length;
  if (onCount === 0) return 'none';
  if (onCount === items.length) return 'all';
  return 'partial';
}

export type FeatureState =
  | { kind: 'toggle'; active: boolean }
  /**
   * A group of related toggles. Items are the source of truth — the
   * aggregate pill (all/partial/none) is derived at render time from
   * how many items are `on`. Adapter renders the row as expandable
   * when used in surfaces that support it.
   */
  | {
      kind: 'group';
      items: Array<{
        value: string;
        label: string;
        preview?: string;
        on: boolean;
        toggle: () => void;
      }>;
      /** Click handler for the aggregate pill when state is 'partial'
       *  (e.g. in Cmd+K All tab, jump to Actions tab instead of toggling). */
      onPartial?: () => void;
    }
  | { kind: 'select'; currentValue: string }
  /** Ordered magnitude (low→high). Renders as a continuous slider. */
  | {
      kind: 'segmented';
      options: string[];
      currentValue: string | null;
      onSelect: (v: string) => void;
    }
  /** Discrete equal-weight choices. Renders as a radio pill group. */
  | {
      kind: 'choice';
      options: Array<{ value: string; label: string }>;
      currentValue: string;
      onSelect: (v: string) => void;
    };
