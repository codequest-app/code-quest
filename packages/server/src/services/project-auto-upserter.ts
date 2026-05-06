import { EVENTS, type Project } from '@code-quest/shared';
import { logger } from '../logger.ts';
import type { ProjectStore } from './project-store.ts';

/** Broadcaster shape — matches ChannelEmitter.broadcastAll. Loose to avoid coupling. */
interface ProjectBroadcaster {
  broadcastAll(event: string, payload: Project): void;
}

/**
 * Bridges session lifecycle → project entity.
 *
 * When a session is created/initialized, ensure a corresponding `projects`
 * row exists (upsert) and broadcast the change. Called explicitly from session
 * handlers so that:
 * - SessionStore stays pure persistence (no domain leak)
 * - ProjectStore stays pure persistence (no broadcast/lifecycle awareness)
 * - All session-creation paths (init / fork / resume / worktree) get consistent
 *   project-sync by calling this single entry point.
 */
export class ProjectAutoUpserter {
  private projectStore: ProjectStore;
  private broadcaster: ProjectBroadcaster;
  constructor(projectStore: ProjectStore, broadcaster: ProjectBroadcaster) {
    this.projectStore = projectStore;
    this.broadcaster = broadcaster;
  }

  /**
   * Call after a session row was upserted with `projectRoot`. Idempotent.
   * Does not throw — failures are logged so session lifecycle isn't blocked.
   */
  async onSessionCreated(projectRoot: string): Promise<void> {
    if (!projectRoot) return;
    try {
      const existed = await this.projectStore.getByPath(projectRoot);
      const project = await this.projectStore.upsert(projectRoot);
      this.broadcaster.broadcastAll(
        existed ? EVENTS.projects.updated : EVENTS.projects.added,
        project,
      );
    } catch (err) {
      logger.warn({ err, projectRoot }, 'Failed to upsert project after session creation');
    }
  }
}
