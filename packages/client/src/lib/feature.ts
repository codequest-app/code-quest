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
  };
  execute(): void;
}

export function isSlashCommandFeature(f: ChannelFeature): f is SlashCommandFeature {
  return 'command' in f && 'invoke' in f;
}

export function isMenuItemFeature(f: ChannelFeature): f is MenuItemFeature {
  return 'menuItem' in f && 'execute' in f;
}
