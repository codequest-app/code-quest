import { vi } from 'vitest';

type MediaQueryMatcher = (query: string, width: number) => boolean;

const DEFAULT_MATCHER: MediaQueryMatcher = (query, width) => {
  if (query === '(min-width: 1024px)') return width >= 1024;
  if (query === '(min-width: 768px)') return width >= 768;
  return false;
};

class FakeMediaQueryList extends EventTarget implements MediaQueryList {
  onchange: MediaQueryList['onchange'] = null;

  readonly media: string;
  private readonly getMatches: () => boolean;

  constructor(media: string, getMatches: () => boolean) {
    super();
    this.media = media;
    this.getMatches = getMatches;
  }

  get matches(): boolean {
    return this.getMatches();
  }

  // Deprecated aliases required by the MediaQueryList interface
  addListener(listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void): void {
    this.addEventListener('change', listener as EventListener);
  }
  removeListener(listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void): void {
    this.removeEventListener('change', listener as EventListener);
  }
}

export interface FakeMatchMedia {
  /** Update the simulated viewport width and fire `change` on matching queries. */
  triggerChange(newWidth: number): void;
}

/**
 * Install a fake `window.matchMedia` driven by a simulated viewport width.
 * Call `vi.restoreAllMocks()` (or its equivalent) in afterEach to clean up.
 */
export function setupMatchMedia(
  initialWidth: number,
  matcher: MediaQueryMatcher = DEFAULT_MATCHER,
): FakeMatchMedia {
  let currentWidth = initialWidth;
  const lists = new Map<string, FakeMediaQueryList>();

  window.matchMedia = vi.fn((query: string) => {
    let list = lists.get(query);
    if (!list) {
      list = new FakeMediaQueryList(query, () => matcher(query, currentWidth));
      lists.set(query, list);
    }
    return list;
  });

  return {
    triggerChange(newWidth: number) {
      currentWidth = newWidth;
      for (const [query, list] of lists) {
        const matches = matcher(query, newWidth);
        // jsdom doesn't ship MediaQueryListEvent — synthesize via Event +
        // attached fields, which is what useMediaQuery reads.
        const event = new Event('change') as Event & { matches: boolean; media: string };
        event.matches = matches;
        event.media = query;
        list.dispatchEvent(event);
      }
    },
  };
}
