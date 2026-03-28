import { Router } from 'express';
import type { RawEventStore } from '../services/raw-event-store.ts';
import type { SessionStore } from '../services/session-store.ts';

export function createSessionsRouter(
  sessionStore: SessionStore,
  rawEventStore?: RawEventStore,
): Router {
  const router = Router();

  router.get('/api/sessions', async (req, res) => {
    try {
      const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
      const offset = Math.max(Number(req.query.offset) || 0, 0);
      const result = await sessionStore.list({ limit, offset });

      if (rawEventStore) {
        const previews = await Promise.all(
          result.sessions.map((s) => rawEventStore.getPreview(s.id)),
        );
        const enriched = result.sessions.map((s, i) => ({
          ...s,
          firstUserMessage: previews[i].firstUser,
          lastAssistantMessage: previews[i].lastAssistant,
        }));
        res.json({ sessions: enriched, total: result.total });
      } else {
        res.json(result);
      }
    } catch (err) {
      res
        .status(500)
        .json({ error: err instanceof Error ? err.message : 'Failed to list sessions' });
    }
  });

  router.get('/api/sessions/:id', async (req, res) => {
    try {
      const session = await sessionStore.getById(req.params.id);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }
      res.json(session);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to get session' });
    }
  });

  router.get('/api/sessions/:id/events', async (req, res) => {
    try {
      if (!rawEventStore) {
        res.status(501).json({ error: 'Event store not available' });
        return;
      }
      const events = await rawEventStore.getBySession(req.params.id);
      const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 1000);
      const offset = Math.max(Number(req.query.offset) || 0, 0);
      const paged = events.slice(offset, offset + limit);
      res.json({ events: paged, total: events.length });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to get events' });
    }
  });

  return router;
}
