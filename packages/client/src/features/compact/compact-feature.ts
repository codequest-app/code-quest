import type { SlashCommandFeature } from '../../lib/feature';

export function createCompactFeature(
  sendToCliDirectly: (message: string) => void,
): SlashCommandFeature {
  return {
    id: 'compact',
    command: '/compact',
    match(message) {
      return message.trim() === '/compact' || message.trim().startsWith('/compact ');
    },
    invoke(message) {
      sendToCliDirectly(message);
    },
  };
}
