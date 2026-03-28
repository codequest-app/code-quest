import { Router } from 'express';
import type { UsageTracker } from '../services/usage-tracker.ts';

export function createUsageRouter(usageTracker: UsageTracker): Router {
  const router = Router();

  router.get('/api/usage', (_req, res) => {
    try {
      const usage = usageTracker.getUsage();
      res.json(usage);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to get usage' });
    }
  });

  return router;
}
