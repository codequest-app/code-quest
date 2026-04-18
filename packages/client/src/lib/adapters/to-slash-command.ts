import type { Feature, SlashCommandFeature } from '../feature';

export function toSlashCommand(f: Feature): SlashCommandFeature | null {
  if (!f.slash) return null;
  return {
    id: f.id,
    command: f.slash.command,
    match: f.slash.match,
    invoke: f.slash.invoke,
  };
}
