import type { Feature } from '@/lib/feature';

interface MentionFileFeatureDeps {
  mentionFile: () => void;
}

export function createMentionFileFeature({ mentionFile }: MentionFileFeatureDeps): Feature {
  return {
    id: 'mention-file',
    label: 'Mention file from this project...',
    section: 'Context',
    order: -1,
    execute() {
      mentionFile();
    },
  };
}
