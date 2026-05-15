import { UsageTracker } from '../usage-tracker.ts';

describe('UsageTracker', () => {
  let tracker: UsageTracker;

  beforeEach(() => {
    tracker = new UsageTracker();
  });

  it('returns empty UsageQuota when no data', () => {
    expect(tracker.getUsage()).toEqual({});
  });

  it('sets utilization to 0 for allowed status', () => {
    tracker.update({
      status: 'allowed',
      rateLimitType: 'five_hour',
      resetsAt: 1772319600,
    });

    const usage = tracker.getUsage();
    expect(usage.five_hour).toEqual({
      utilization: 0,
      resets_at: new Date(1772319600 * 1000).toISOString(),
    });
  });

  it('sets utilization to 1.0 for blocked status', () => {
    tracker.update({
      status: 'blocked',
      rateLimitType: 'five_hour',
      resetsAt: 1772319600,
    });

    const usage = tracker.getUsage();
    expect(usage.five_hour).toEqual({
      utilization: 1.0,
      resets_at: new Date(1772319600 * 1000).toISOString(),
    });
  });

  it('handles seven_day tier', () => {
    tracker.update({
      status: 'blocked',
      rateLimitType: 'seven_day',
      resetsAt: 1772319600,
    });

    expect(tracker.getUsage().seven_day).toEqual({
      utilization: 1.0,
      resets_at: new Date(1772319600 * 1000).toISOString(),
    });
  });

  it('handles seven_day_sonnet tier', () => {
    tracker.update({
      status: 'allowed',
      rateLimitType: 'seven_day_sonnet',
    });

    expect(tracker.getUsage().seven_day_sonnet).toEqual({
      utilization: 0,
    });
  });

  it('omits resets_at when resetsAt is undefined', () => {
    tracker.update({
      status: 'allowed',
      rateLimitType: 'five_hour',
    });

    expect(tracker.getUsage().five_hour).toEqual({ utilization: 0 });
  });

  it('maps isUsingOverage to extra_usage', () => {
    tracker.update({
      status: 'allowed',
      rateLimitType: 'five_hour',
      isUsingOverage: true,
      overageStatus: 'active',
    });

    expect(tracker.getUsage().extra_usage).toEqual({
      is_enabled: true,
      overageStatus: 'active',
    });
  });

  it('maps isUsingOverage false', () => {
    tracker.update({
      status: 'allowed',
      rateLimitType: 'five_hour',
      isUsingOverage: false,
    });

    expect(tracker.getUsage().extra_usage).toEqual({
      is_enabled: false,
    });
  });

  it('tracks multiple tiers independently', () => {
    tracker.update({ status: 'blocked', rateLimitType: 'five_hour', resetsAt: 100 });
    tracker.update({ status: 'allowed', rateLimitType: 'seven_day', resetsAt: 200 });

    const usage = tracker.getUsage();
    expect(usage.five_hour?.utilization).toBe(1.0);
    expect(usage.seven_day?.utilization).toBe(0);
  });

  it('overwrites previous data for same tier', () => {
    tracker.update({ status: 'blocked', rateLimitType: 'five_hour' });
    tracker.update({ status: 'allowed', rateLimitType: 'five_hour' });

    expect(tracker.getUsage().five_hour?.utilization).toBe(0);
  });

  it('stores raw utilization from rateLimitInfo', () => {
    tracker.update({
      status: 'allowed',
      rateLimitType: 'five_hour',
      resetsAt: 1772319600,
      utilization: 0.42,
    });

    const usage = tracker.getUsage();
    expect(usage.five_hour).toEqual({
      utilization: 0.42,
      resets_at: new Date(1772319600 * 1000).toISOString(),
    });
  });

  it('falls back to binary utilization when utilization not provided', () => {
    tracker.update({
      status: 'allowed',
      rateLimitType: 'five_hour',
    });
    expect(tracker.getUsage().five_hour?.utilization).toBe(0);

    tracker.update({
      status: 'blocked',
      rateLimitType: 'five_hour',
    });
    expect(tracker.getUsage().five_hour?.utilization).toBe(1.0);
  });

  it('tracks overageStatus in extra_usage', () => {
    tracker.update({
      status: 'allowed',
      rateLimitType: 'five_hour',
      isUsingOverage: true,
      overageStatus: 'active',
    });

    expect(tracker.getUsage().extra_usage).toEqual({
      is_enabled: true,
      overageStatus: 'active',
    });
  });

  it('ignores unknown rateLimitType gracefully', () => {
    tracker.update({ status: 'allowed', rateLimitType: 'unknown_tier' });
    const usage = tracker.getUsage();
    expect(usage.five_hour).toBeUndefined();
    expect(usage.seven_day).toBeUndefined();
    expect(usage.seven_day_sonnet).toBeUndefined();
  });
});
