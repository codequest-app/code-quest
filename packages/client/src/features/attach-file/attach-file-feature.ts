import type { Feature } from '../../lib/feature';

export interface AttachFileFeatureDeps {
  onAttachFile?: () => void;
}

export function createAttachFileFeature({ onAttachFile }: AttachFileFeatureDeps): Feature {
  return {
    id: 'attach-file',
    label: 'Attach file…',
    section: 'Context',
    order: -2,
    ui: { closeSilent: true },
    execute() {
      onAttachFile?.();
    },
  };
}
