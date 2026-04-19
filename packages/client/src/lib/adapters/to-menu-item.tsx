import type { Feature, MenuItemView } from '../feature';
import { renderMenuTrailing } from './trailing-renderers';

export function toMenuItem(f: Feature): MenuItemView {
  return {
    id: f.id,
    menuItem: {
      label: f.label,
      section: f.section,
      order: f.order,
      description: f.description,
      disabled: f.disabled,
      closeSilent: f.ui?.closeSilent ?? f.state?.kind === 'toggle',
      matchFirstToken: f.ui?.matchFirstToken,
      filterOnly: f.ui?.filterOnly,
      trailing: renderMenuTrailing(f.state, { featureId: f.id }),
    },
    execute: f.execute,
  };
}
