import type { MenuItemFeature } from '../../lib/feature';

const FALLBACK_DOCS_URL = 'https://docs.anthropic.com/en/docs/claude-code/overview';

export function createViewHelpFeature({
  openUrl,
  docsUrl,
}: {
  openUrl: (url: string) => void;
  docsUrl?: string;
}): MenuItemFeature {
  return {
    id: 'view-help',
    menuItem: { label: 'View help docs', section: 'Support', closeSilent: true },
    execute() {
      openUrl(docsUrl ?? FALLBACK_DOCS_URL);
    },
  };
}
