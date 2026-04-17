import type { MenuItemFeature } from '../../lib/feature';

export function createNewConversationFeature({
  sendMessage,
}: {
  sendMessage: (msg: string) => void;
}): MenuItemFeature {
  return {
    id: 'new-conversation',
    menuItem: { label: 'New conversation', section: 'Context', filterOnly: true },
    execute() {
      sendMessage('/new');
    },
  };
}
