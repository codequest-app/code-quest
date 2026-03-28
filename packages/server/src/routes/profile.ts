import type { AuthStatus } from '@code-quest/shared';
import { Router } from 'express';

export function createProfileRouter(getAuthStatus: () => AuthStatus): Router {
  const router = Router();

  router.get('/api/profile', (_req, res) => {
    try {
      const status = getAuthStatus();
      res.json(status);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to get profile' });
    }
  });

  return router;
}
