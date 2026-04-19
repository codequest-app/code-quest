import type { MenuItem } from './build-menu-items';

interface MenuSections {
  context: MenuItem[];
  model: MenuItem[];
  customize: MenuItem[];
  slash: MenuItem[];
  settings: MenuItem[];
  support: MenuItem[];
}

/**
 * Filtered + laid-out view of the menu, derived purely from the given
 * sections and current filter string. No component state involved — CommandMenu
 * just destructures and renders.
 */
export interface MenuLayout extends MenuSections {
  /** True when filter is empty OR at least one model item matched. When false,
   *  the model section (header + rows) is suppressed entirely to avoid a
   *  lingering empty header under a non-empty search. */
  modelVisible: boolean;
  /** Flat in-display-order list — source of truth for keyboard navigation
   *  and auto-select-first. */
  flatItems: MenuItem[];
  /** Whether each section has any preceding *visible* section; the renderer
   *  uses this to decide whether to draw a divider above it. Context is the
   *  implicit first section, so it has no entry. */
  hasPrev: {
    model: boolean;
    customize: boolean;
    slash: boolean;
    settings: boolean;
    support: boolean;
  };
}

export function filterMenuItems(items: MenuItem[], filter: string): MenuItem[] {
  const f = filter.toLowerCase();
  return items.filter((i) => {
    if (i.filterOnly && !f) return false;
    if (!f) return true;
    const matchText = i.matchFirstToken ? f.split(' ')[0] : f;
    return i.label.toLowerCase().includes(matchText);
  });
}

export function computeMenuLayout(sections: MenuSections, filter: string): MenuLayout {
  const f = filter.toLowerCase();
  const context = filterMenuItems(sections.context, filter);
  const model = filterMenuItems(sections.model, filter);
  const customize = filterMenuItems(sections.customize, filter);
  const slash = filterMenuItems(sections.slash, filter);
  const settings = filterMenuItems(sections.settings, filter);
  const support = filterMenuItems(sections.support, filter);

  const modelVisible = !f || model.length > 0;

  const contextPresent = context.length > 0;
  const hasPrevModel = contextPresent;
  const hasPrevCustomize = contextPresent || modelVisible;
  const hasPrevSlash = hasPrevCustomize || customize.length > 0;
  const hasPrevSettings = hasPrevSlash || slash.length > 0;
  const hasPrevSupport = hasPrevSettings || settings.length > 0;

  const flatItems = [
    ...context,
    ...(modelVisible ? model : []),
    ...customize,
    ...slash,
    ...settings,
    ...support,
  ];

  return {
    context,
    model,
    customize,
    slash,
    settings,
    support,
    modelVisible,
    flatItems,
    hasPrev: {
      model: hasPrevModel,
      customize: hasPrevCustomize,
      slash: hasPrevSlash,
      settings: hasPrevSettings,
      support: hasPrevSupport,
    },
  };
}
