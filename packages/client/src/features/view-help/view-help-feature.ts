import type { Feature } from '../../lib/feature';

const FALLBACK_DOCS_URL = 'https://docs.anthropic.com/en/docs/claude-code/overview';

export function createViewHelpFeature({
  openUrl,
  docsUrl,
}: {
  openUrl: (url: string) => void;
  docsUrl?: string;
}): Feature {
  return {
    id: 'view-help',
    label: 'View help docs',
    section: 'Support',
    ui: { closeSilent: true },
    execute() {
      openUrl(docsUrl ?? FALLBACK_DOCS_URL);
    },
  };
}
