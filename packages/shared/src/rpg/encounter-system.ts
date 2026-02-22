import { analyzeComplexity } from './enemy-generator.ts';
import { WILDERNESS_SUB_ZONES } from './locations.ts';
import type { WildernessSubZoneId, Zone } from './map-types.ts';

const COMPLEXITY_THRESHOLD = 8;

export interface EncounterResult {
  trigger: boolean;
  complexity: number;
  subZone: WildernessSubZoneId;
  encounterRate: number;
  reason?: 'not_wilderness' | 'complexity_too_low';
}

export function shouldTriggerEncounter(
  prompt: string,
  zone: Zone,
  subZone: WildernessSubZoneId = 'forest',
): EncounterResult {
  const subZoneDef = WILDERNESS_SUB_ZONES.find((z) => z.id === subZone);
  const encounterRate = subZoneDef?.encounterRate ?? 0.3;
  const { total: complexity } = analyzeComplexity(prompt);

  if (zone !== 'wilderness') {
    return { trigger: false, complexity, subZone, encounterRate, reason: 'not_wilderness' };
  }

  if (complexity < COMPLEXITY_THRESHOLD) {
    return { trigger: false, complexity, subZone, encounterRate, reason: 'complexity_too_low' };
  }

  return { trigger: true, complexity, subZone, encounterRate };
}
