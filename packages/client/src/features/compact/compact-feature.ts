import type { Feature } from '../../lib/feature';

export function createCompactFeature(sendToCliDirectly: (message: string) => void): Feature {
  return {
    id: 'compact',
    label: '/compact',
    category: 'Slash Commands',
    ui: { filterOnly: true },
    execute() {
      sendToCliDirectly('/compact');
    },
    slash: {
      command: '/compact',
      match(message) {
        return message.trim() === '/compact' || message.trim().startsWith('/compact ');
      },
      invoke(message) {
        sendToCliDirectly(message);
      },
    },
  };
}
