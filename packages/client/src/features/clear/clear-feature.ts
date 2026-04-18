import type { Feature } from '../../lib/feature';

export interface ClearFeatureDeps {
  clearMessages: () => void;
  clearModifiedFiles: () => void;
  sendMessage: (msg: string) => void;
}

export function createClearFeature({
  clearMessages,
  clearModifiedFiles,
  sendMessage,
}: ClearFeatureDeps): Feature {
  return {
    id: 'clear',
    label: 'Clear conversation',
    category: 'Context',
    order: 0,
    execute() {
      clearMessages();
      clearModifiedFiles();
      sendMessage('/clear');
    },
  };
}
