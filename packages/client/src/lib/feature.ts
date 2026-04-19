export interface SlashCommandView {
  id: string;
  command: string;
  match?(message: string): boolean;
  invoke(message: string): void;
  execute?(): void;
}

export interface MenuItemView {
  id: string;
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
export interface Feature {
  id: string;
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

const PALETTE_TABS = ['all', 'actions'] as const;
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
