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
  category: string;
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

export type FeatureState =
  | { kind: 'toggle'; active: boolean }
  | { kind: 'tri-state'; state: 'all' | 'partial' | 'none'; onPartial?: () => void }
  | { kind: 'select'; currentValue: string };
