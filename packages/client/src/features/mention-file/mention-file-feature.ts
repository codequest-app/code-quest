import type { MenuItemFeature } from '../../lib/feature';

export interface MentionFileFeatureDeps {
  mentionFile: () => void;
}

export function createMentionFileFeature({ mentionFile }: MentionFileFeatureDeps): MenuItemFeature {
  return {
    id: 'mention-file',
    menuItem: { label: 'Mention file from this project...', section: 'Context', order: -1 },
    execute() {
      mentionFile();
    },
  };
}
