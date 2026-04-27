import { describe, expect, it } from 'vitest';
import { buildInitialConfig } from '../ChannelConfigContext';

describe('buildInitialConfig', () => {
  it('picks model and permissionMode when both are strings', () => {
    expect(buildInitialConfig({ model: 'opus', permissionMode: 'auto' })).toEqual({
      model: 'opus',
      permissionMode: 'auto',
    });
  });

  it('omits non-string values', () => {
    expect(buildInitialConfig({ model: 123, permissionMode: null })).toEqual({});
  });

  it('returns empty object for empty input', () => {
    expect(buildInitialConfig({})).toEqual({});
  });

  it('picks only model when permissionMode is missing', () => {
    expect(buildInitialConfig({ model: 'sonnet' })).toEqual({ model: 'sonnet' });
  });
});
