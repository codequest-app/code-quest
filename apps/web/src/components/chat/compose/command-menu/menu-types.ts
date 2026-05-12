export const SLASH_SECTION = 'Slash Commands' as const;

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
