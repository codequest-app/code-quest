import type { Feature } from '@/lib/feature';

export function createNewConversationFeature({
  sendMessage,
}: {
  sendMessage: (msg: string) => void;
}): Feature {
  return {
    id: 'new-conversation',
    label: 'New conversation',
    section: 'Context',
    ui: { filterOnly: true },
    execute() {
      sendMessage('/new');
    },
  };
}
