import { describe, expect, it } from 'vitest';
import { WILDERNESS_LOCATIONS, WILDERNESS_SUB_ZONES } from '../locations.ts';

describe('WILDERNESS_SUB_ZONES', () => {
  it('has 4 sub-zones: forest, mountains, wasteland, volcano', () => {
    const ids = WILDERNESS_SUB_ZONES.map((z) => z.id);
    expect(ids).toEqual(['forest', 'mountains', 'wasteland', 'volcano']);
  });

  it('each sub-zone has an encounter rate between 0 and 1', () => {
    for (const zone of WILDERNESS_SUB_ZONES) {
      expect(zone.encounterRate).toBeGreaterThan(0);
      expect(zone.encounterRate).toBeLessThanOrEqual(1);
    }
  });

  it('encounter rates increase by sub-zone difficulty', () => {
    const rates = WILDERNESS_SUB_ZONES.map((z) => z.encounterRate);
    for (let i = 1; i < rates.length; i++) {
      expect(rates[i]).toBeGreaterThan(rates[i - 1]);
    }
  });

  it('each sub-zone has a complexity range', () => {
    for (const zone of WILDERNESS_SUB_ZONES) {
      expect(zone.complexityRange.min).toBeLessThan(zone.complexityRange.max);
    }
  });
});

describe('WILDERNESS_LOCATIONS', () => {
  it('has 4 locations matching the sub-zones', () => {
    expect(WILDERNESS_LOCATIONS.length).toBe(4);
  });

  it('all locations belong to wilderness zone', () => {
    for (const loc of WILDERNESS_LOCATIONS) {
      expect(loc.zone).toBe('wilderness');
    }
  });

  it('all locations have unique ids', () => {
    const ids = WILDERNESS_LOCATIONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all locations have non-empty description', () => {
    for (const loc of WILDERNESS_LOCATIONS) {
      expect(loc.description.length).toBeGreaterThan(0);
    }
  });
});
