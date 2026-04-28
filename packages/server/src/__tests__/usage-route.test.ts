import type { UsageQuota } from '@code-quest/shared';
import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createUsageRouter } from '../routes/usage.ts';
import { UsageTracker } from '../services/usage-tracker.ts';

class FakeUsageTracker extends UsageTracker {
  private readonly usage: UsageQuota;
  constructor(usage: UsageQuota = {}) {
    super();
    this.usage = usage;
  }
  override getUsage(): UsageQuota {
    return this.usage;
  }
}

class BrokenUsageTracker extends UsageTracker {
  override getUsage(): UsageQuota {
    throw new Error('tracker broken');
  }
}

describe('GET /api/usage', () => {
  it('returns usage data from tracker', async () => {
    const usage = { five_hour: { utilization: 0.3 } };
    const tracker = new FakeUsageTracker(usage);
    const app = express();
    app.use(createUsageRouter(tracker));

    const res = await request(app).get('/api/usage');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(usage);
  });

  it('returns empty usage when no data', async () => {
    const tracker = new FakeUsageTracker({});
    const app = express();
    app.use(createUsageRouter(tracker));

    const res = await request(app).get('/api/usage');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
  });

  it('returns 500 on tracker error', async () => {
    const tracker = new BrokenUsageTracker();
    const app = express();
    app.use(createUsageRouter(tracker));

    const res = await request(app).get('/api/usage');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('tracker broken');
  });
});
