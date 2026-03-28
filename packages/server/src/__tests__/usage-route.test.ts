import express from 'express';
import request from 'supertest';
import { createUsageRouter } from '../routes/usage.ts';
import type { UsageTracker } from '../services/usage-tracker.ts';

function createMockTracker(usage = {}): UsageTracker {
  return {
    update: vi.fn(),
    getUsage: vi.fn().mockReturnValue(usage),
  } as unknown as UsageTracker;
}

describe('GET /api/usage', () => {
  it('returns usage data from tracker', async () => {
    const usage = { five_hour: { utilization: 0.3 } };
    const tracker = createMockTracker(usage);
    const app = express();
    app.use(createUsageRouter(tracker));

    const res = await request(app).get('/api/usage');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(usage);
    expect(tracker.getUsage).toHaveBeenCalled();
  });

  it('returns empty usage when no data', async () => {
    const tracker = createMockTracker({});
    const app = express();
    app.use(createUsageRouter(tracker));

    const res = await request(app).get('/api/usage');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
  });

  it('returns 500 on tracker error', async () => {
    const tracker = createMockTracker();
    (tracker.getUsage as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('tracker broken');
    });
    const app = express();
    app.use(createUsageRouter(tracker));

    const res = await request(app).get('/api/usage');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('tracker broken');
  });
});
