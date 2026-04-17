import type { MenuItemFeature } from '../../lib/feature';

export interface ClearFeatureDeps {
  clearMessages: () => void;
  clearModifiedFiles: () => void;
  sendMessage: (msg: string) => void;
}

export function createClearFeature({
  clearMessages,
  clearModifiedFiles,
  sendMessage,
}: ClearFeatureDeps): MenuItemFeature {
  return {
    id: 'clear',
    menuItem: { label: 'Clear conversation', section: 'Context', order: 0 },
    execute() {
      clearMessages();
      clearModifiedFiles();
      sendMessage('/clear');
    },
  };
}
