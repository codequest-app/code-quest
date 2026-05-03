import { Router } from 'express';
import { logger } from '../logger.ts';
import type { RawEventStore } from '../services/raw-event-store.ts';
import type { SessionStore } from '../services/session-store.ts';

const DEFAULT_SESSIONS_LIMIT = 20;
const MAX_SESSIONS_LIMIT = 100;
const DEFAULT_EVENTS_LIMIT = 100;
const MAX_EVENTS_LIMIT = 1000;

function clampPaginationParam(value: unknown, defaultVal: number, max: number): number {
  return Math.min(Math.max(Number(value) || defaultVal, 1), max);
}

export function createSessionsRouter(
  sessionStore: SessionStore,
  rawEventService?: RawEventStore,
): Router {
  const router = Router();

  router.get('/api/sessions', async (req, res) => {
    try {
      const limit = clampPaginationParam(
        req.query.limit,
        DEFAULT_SESSIONS_LIMIT,
        MAX_SESSIONS_LIMIT,
      );
      const offset = Math.max(Number(req.query.offset) || 0, 0);
      const result = await sessionStore.list({ limit, offset });

      if (rawEventService) {
        const previews = await Promise.all(
          result.sessions.map((s) => rawEventService.getPreview(s.id)),
        );
        const enriched = result.sessions.map((s, i) => ({
          ...s,
          lastAssistantMessage: previews[i]?.lastAssistant,
        }));
        res.json({ sessions: enriched, total: result.total });
      } else {
        res.json(result);
      }
    } catch (err) {
      logger.error({ err }, 'Failed to list sessions');
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
      logger.error({ err }, 'Failed to get session');
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to get session' });
    }
  });

  router.get('/api/sessions/:id/events', async (req, res) => {
    try {
      if (!rawEventService) {
        res.status(501).json({ error: 'Event store not available' });
        return;
      }
      const events = await rawEventService.getBySession(req.params.id);
      const limit = clampPaginationParam(req.query.limit, DEFAULT_EVENTS_LIMIT, MAX_EVENTS_LIMIT);
      const offset = Math.max(Number(req.query.offset) || 0, 0);
      const paged = events.slice(offset, offset + limit);
      res.json({ events: paged, total: events.length });
    } catch (err) {
      logger.error({ err }, 'Failed to get events');
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to get events' });
    }
  });

  return router;
}
