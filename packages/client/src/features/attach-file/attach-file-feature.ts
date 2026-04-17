import type { MenuItemFeature } from '../../lib/feature';

export interface AttachFileFeatureDeps {
  onAttachFile?: () => void;
}

export function createAttachFileFeature({ onAttachFile }: AttachFileFeatureDeps): MenuItemFeature {
  return {
    id: 'attach-file',
    menuItem: { label: 'Attach file…', section: 'Context', order: -2, closeSilent: true },
    execute() {
      onAttachFile?.();
    },
  };
}
