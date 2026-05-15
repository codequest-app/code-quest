import { homedir } from 'node:os';
import type {
  Project,
  ProjectsAddResponse,
  ProjectsListResponse,
  ProjectsRemoveResponse,
  ProjectsUpdateResponse,
} from '@code-quest/schemas';
import { segments as s } from '@code-quest/summoner/test';
import type { Container } from 'inversify';
import { describe, expect, it } from 'vitest';
import type { ProjectStore } from '../services/project-store.ts';
import { createFakeServer, createFakeSummoner, createTestContainer } from '../test/index.ts';
import { TYPES } from '../types.ts';

// Use a sentinel session cwd distinct from project test paths so auto-upsert
// of the session's project doesn't pollute the tested project list.
const SESSION_CWD = '/sessionland';

interface SetupResult {
  container: Container;
  summoner: ReturnType<typeof createFakeSummoner>;
  claude: ReturnType<ReturnType<typeof createFakeSummoner>['claude']>;
  projectStore: ProjectStore;
}

async function setup(): Promise<SetupResult> {
  const container = createTestContainer();
  const server = createFakeServer(container);
  const summoner = createFakeSummoner(server);
  summoner.filesystem().fromTree(SESSION_CWD, {});
  const claude = summoner.claude();
  await claude.initialize({ launch: { cwd: SESSION_CWD } }, s.init('test-sess'));
  const projectStore = container.get<ProjectStore>(TYPES.ProjectStore);
  return { container, summoner, claude, projectStore };
}

function withoutSessionProject(projects: Project[]): Project[] {
  return projects.filter((p) => p.path !== SESSION_CWD);
}

describe('projects socket handler', () => {
  describe('projects:list', () => {
    it('returns no user-added projects initially', async () => {
      const { claude } = await setup();
      const res = await claude.send<ProjectsListResponse>('projects:list', {});
      if ('error' in res) throw new Error(res.error);
      expect(withoutSessionProject(res.projects)).toEqual([]);
    });

    it('returns added projects', async () => {
      const { claude, summoner } = await setup();
      summoner.filesystem().fromTree('/tmp', { 'code-quest': {} });

      await claude.send<ProjectsAddResponse>('projects:add', { path: '/tmp/code-quest' });
      const list = await claude.send<ProjectsListResponse>('projects:list', {});
      if ('error' in list) throw new Error(list.error);
      const userProjects = withoutSessionProject(list.projects);
      expect(userProjects).toHaveLength(1);
      expect(userProjects[0]!.path).toBe('/tmp/code-quest');
    });
  });

  describe('projects:add', () => {
    it('success: ① RPC returns project, ② emits projects:added, ③ DB has row', async () => {
      const { claude, summoner, projectStore } = await setup();
      summoner.filesystem().fromTree('/tmp', { foo: {} });

      // ① RPC response
      const res = await claude.send<ProjectsAddResponse>('projects:add', { path: '/tmp/foo' });
      expect('error' in res).toBe(false);
      const project = res as Project;
      expect(project).toMatchObject({ path: '/tmp/foo', name: 'foo', pinned: false });

      // ② Server broadcast — find the one for our path (session init may have emitted first)
      const allEvents = claude.receivedEvents();
      // Debug: list all event names to understand what was captured
      const addedAny = allEvents.filter(
        (e) => e.event === 'projects:added' && (e.payload as Project)?.path === '/tmp/foo',
      );
      expect(addedAny.length).toBeGreaterThan(0);

      // ③ DB persisted
      expect(await projectStore.getByPath('/tmp/foo')).not.toBeNull();
    });

    it('canonicalizes leading ~ via homedir before validating + persisting', async () => {
      const { claude, summoner, projectStore } = await setup();
      const home = homedir();
      const expected = `${home}/tilde-project`;
      summoner.filesystem().fromTree(home, { 'tilde-project': {} });

      const res = await claude.send<ProjectsAddResponse>('projects:add', {
        path: '~/tilde-project',
      });

      expect('error' in res).toBe(false);
      expect((res as Project).path).toBe(expected);
      expect(await projectStore.getByPath(expected)).not.toBeNull();
      // Original '~'-prefixed path must NOT end up in the store.
      expect(await projectStore.getByPath('~/tilde-project')).toBeNull();
    });

    it('reject non-existent path: ① error response, ② no emit, ③ no DB row', async () => {
      const { claude, summoner, projectStore } = await setup();
      // Path /does is within roots scope but doesn't exist as a directory in fs
      summoner.filesystem().fromTree('/does', {});
      const beforeEvents = claude.receivedEvents('projects:added').length;

      const res = await claude.send<ProjectsAddResponse>('projects:add', {
        path: '/does/not/exist',
      });
      expect(res).toEqual(
        expect.objectContaining({ error: 'path_not_found', path: '/does/not/exist' }),
      );
      expect(claude.receivedEvents('projects:added').length).toBe(beforeEvents);
      expect(await projectStore.getByPath('/does/not/exist')).toBeNull();
    });

    it('reject path outside EXPLORER_ROOTS: ① error, ② no emit, ③ no DB row', async () => {
      const { claude, summoner, projectStore } = await setup();
      // Setup root scope = ['/tmp']; the candidate path is OUTSIDE.
      summoner.filesystem().fromTree('/tmp', {});
      summoner.filesystem().addDirectory('/forbidden', []);
      const beforeEvents = claude.receivedEvents('projects:added').length;

      const res = await claude.send<ProjectsAddResponse>('projects:add', {
        path: '/forbidden',
      });

      expect(res).toEqual(
        expect.objectContaining({ error: 'path_outside_roots', path: '/forbidden' }),
      );
      expect(claude.receivedEvents('projects:added').length).toBe(beforeEvents);
      expect(await projectStore.getByPath('/forbidden')).toBeNull();
    });

    it('accepts the EXPLORER_ROOT itself (boundary inclusive)', async () => {
      const { claude, summoner, projectStore } = await setup();
      summoner.filesystem().fromTree('/projects-root', {});

      const res = await claude.send<ProjectsAddResponse>('projects:add', {
        path: '/projects-root',
      });

      expect('error' in res).toBe(false);
      expect(await projectStore.getByPath('/projects-root')).not.toBeNull();
    });

    it('reject file path: ① error, ② no emit, ③ no DB row', async () => {
      const { claude, summoner, projectStore } = await setup();
      summoner.filesystem().fromTree('/tmp', { 'some-file.txt': 'hello' });
      const beforeEvents = claude.receivedEvents('projects:added').length;

      const res = await claude.send<ProjectsAddResponse>('projects:add', {
        path: '/tmp/some-file.txt',
      });
      expect(res).toEqual(
        expect.objectContaining({ error: 'path_not_directory', path: '/tmp/some-file.txt' }),
      );
      expect(claude.receivedEvents('projects:added').length).toBe(beforeEvents);
      expect(await projectStore.getByPath('/tmp/some-file.txt')).toBeNull();
    });

    it('idempotent: ① same id returned, ③ only one DB row', async () => {
      const { claude, summoner, projectStore } = await setup();
      summoner.filesystem().fromTree('/tmp', { foo: {} });

      const a = (await claude.send<ProjectsAddResponse>('projects:add', {
        path: '/tmp/foo',
      })) as Project;
      const b = (await claude.send<ProjectsAddResponse>('projects:add', {
        path: '/tmp/foo',
      })) as Project;
      expect(a.id).toBe(b.id);
      const list = await projectStore.list();
      expect(list.filter((p) => p.path === '/tmp/foo')).toHaveLength(1);
    });
  });

  describe('projects:update', () => {
    it('name: ① RPC updated project, ② emits projects:updated, ③ DB reflects change', async () => {
      const { claude, summoner, projectStore } = await setup();
      summoner.filesystem().fromTree('/tmp', { foo: {} });

      const added = (await claude.send<ProjectsAddResponse>('projects:add', {
        path: '/tmp/foo',
      })) as Project;
      const beforeUpdated = claude.receivedEvents('projects:updated').length;

      const res = (await claude.send<ProjectsUpdateResponse>('projects:update', {
        id: added.id,
        patch: { name: 'My Foo' },
      })) as Project;

      expect(res.name).toBe('My Foo'); // ①
      expect(claude.receivedEvents('projects:updated').length).toBeGreaterThan(beforeUpdated); // ②
      expect((await projectStore.getById(added.id))?.name).toBe('My Foo'); // ③
    });

    it('pinned toggle: ② emits updated, ③ DB reflects', async () => {
      const { claude, summoner, projectStore } = await setup();
      summoner.filesystem().fromTree('/tmp', { foo: {} });

      const added = (await claude.send<ProjectsAddResponse>('projects:add', {
        path: '/tmp/foo',
      })) as Project;

      const res = (await claude.send<ProjectsUpdateResponse>('projects:update', {
        id: added.id,
        patch: { pinned: true },
      })) as Project;

      expect(res.pinned).toBe(true);
      expect((await projectStore.getById(added.id))?.pinned).toBe(true);
    });

    it('invalid payload returns invalid_payload (not a misleading project_not_found)', async () => {
      const { claude } = await setup();
      // Missing required `id` — zod parse on the server should reject. claude.send
      // is typed loosely, so the invalid shape flows through without a TS error.
      const res = await claude.send<ProjectsUpdateResponse>('projects:update', {
        patch: { name: 'X' },
      });

      expect(res).toEqual({ error: 'invalid_payload' });
    });

    it('unknown id: ① error, ② no emit, ③ DB unchanged', async () => {
      const { claude, projectStore } = await setup();
      const beforeCount = (await projectStore.list()).length;
      const beforeEvents = claude.receivedEvents('projects:updated').length;

      const res = await claude.send<ProjectsUpdateResponse>('projects:update', {
        id: '00000000-0000-4000-8000-000000000000',
        patch: { name: 'X' },
      });

      expect(res).toEqual({ error: 'project_not_found' });
      expect(claude.receivedEvents('projects:updated').length).toBe(beforeEvents);
      expect((await projectStore.list()).length).toBe(beforeCount);
    });
  });

  describe('projects:remove', () => {
    it('no active sessions: ① ok, ② emits removed, ③ DB empty, ④ client broadcast', async () => {
      const { claude, summoner, projectStore } = await setup();
      summoner.filesystem().fromTree('/tmp', { foo: {} });

      const added = (await claude.send<ProjectsAddResponse>('projects:add', {
        path: '/tmp/foo',
      })) as Project;
      const beforeRemoved = claude.receivedEvents('projects:removed').length;

      const res = await claude.send<ProjectsRemoveResponse>('projects:remove', { id: added.id });

      expect(res).toEqual({ ok: true }); // ①
      expect(claude.receivedEvents('projects:removed').length).toBeGreaterThan(beforeRemoved); // ②
      expect(await projectStore.getById(added.id)).toBeNull(); // ③
    });

    it('with active session: ① error + count, ② no emit, ③ DB unchanged', async () => {
      // Session on SESSION_CWD is active (claude.initialize'd that path).
      const { claude, projectStore } = await setup();
      const list = await claude.send<ProjectsListResponse>('projects:list', {});
      if ('error' in list) throw new Error(list.error);
      const sessionProject = list.projects.find((p) => p.path === SESSION_CWD);
      expect(sessionProject).toBeTruthy();
      const beforeEvents = claude.receivedEvents('projects:removed').length;
      const beforeRow = await projectStore.getById(sessionProject!.id);
      expect(beforeRow).not.toBeNull();

      const res = await claude.send<ProjectsRemoveResponse>('projects:remove', {
        id: sessionProject!.id,
      });

      expect(res).toEqual({ error: 'project_has_active_sessions', activeSessionCount: 1 }); // ①
      expect(claude.receivedEvents('projects:removed').length).toBe(beforeEvents); // ②
      expect(await projectStore.getById(sessionProject!.id)).not.toBeNull(); // ③ still there
    });

    it('orphan DB session (no live channel) does NOT block removal', async () => {
      // Reproduces user-reported bug: server restart leaves session rows with
      // status='active' but no actual process. Old impl checked sessionStore
      // and refused to remove. Correct check is "live channel exists".
      const { claude, summoner, projectStore, container } = await setup();
      summoner.filesystem().fromTree('/tmp', { orphaned: {} });
      const added = (await claude.send<ProjectsAddResponse>('projects:add', {
        path: '/tmp/orphaned',
      })) as Project;

      // Inject a stale session row (as if from a previous server lifetime)
      const sessionStore = container.get<import('../services/session-store.ts').SessionStore>(
        TYPES.SessionStore,
      );
      await sessionStore.upsert({
        id: 'orphan-1',
        channelId: 'orphan-ch-1',
        provider: 'claude',
        command: 'claude',
        args: '[]',
        mode: 'interactive',
        role: 'chat',
        cwd: '/tmp/orphaned',
        projectRoot: '/tmp/orphaned',
        title: null,
        status: 'active', // stale: no real channel exists
        createdAt: new Date().toISOString(),
      });

      const res = await claude.send<ProjectsRemoveResponse>('projects:remove', {
        id: added.id,
      });
      expect(res).toEqual({ ok: true });
      expect(await projectStore.getById(added.id)).toBeNull();
    });

    it('unknown id: ① error, ② no emit', async () => {
      const { claude } = await setup();
      const beforeEvents = claude.receivedEvents('projects:removed').length;

      const res = await claude.send<ProjectsRemoveResponse>('projects:remove', {
        id: '00000000-0000-4000-8000-000000000000',
      });

      expect(res).toEqual({ error: 'project_not_found' });
      expect(claude.receivedEvents('projects:removed').length).toBe(beforeEvents);
    });
  });

  describe('management is NOT gated by EXPLORER_ROOTS (only :add is)', () => {
    it('projects:update succeeds when path is outside current EXPLORER_ROOTS', async () => {
      const { claude, summoner, projectStore } = await setup();
      // Add while /tmp is a root
      summoner.filesystem().fromTree('/tmp', { legacy: {} });
      const added = (await claude.send<ProjectsAddResponse>('projects:add', {
        path: '/tmp/legacy',
      })) as Project;

      // Admin shrinks roots — /tmp/legacy is now outside scope
      summoner.filesystem().setRoots(['/elsewhere']);

      const renamed = (await claude.send<ProjectsUpdateResponse>('projects:update', {
        id: added.id,
        patch: { name: 'Legacy', pinned: true },
      })) as Project;

      expect(renamed.name).toBe('Legacy');
      expect(renamed.pinned).toBe(true);
      expect((await projectStore.getById(added.id))?.pinned).toBe(true);
    });

    it('projects:remove succeeds when path is outside current EXPLORER_ROOTS', async () => {
      const { claude, summoner, projectStore } = await setup();
      summoner.filesystem().fromTree('/tmp', { legacy: {} });
      const added = (await claude.send<ProjectsAddResponse>('projects:add', {
        path: '/tmp/legacy',
      })) as Project;

      summoner.filesystem().setRoots(['/elsewhere']);

      const res = await claude.send<ProjectsRemoveResponse>('projects:remove', { id: added.id });
      expect(res).toEqual({ ok: true });
      expect(await projectStore.getById(added.id)).toBeNull();
    });
  });

  describe('session integration (Direction C — ProjectAutoUpserter)', () => {
    it('initializing a session auto-upserts a project (all layers)', async () => {
      const { claude, projectStore } = await setup();

      // ① list includes session cwd
      const list = await claude.send<ProjectsListResponse>('projects:list', {});
      if ('error' in list) throw new Error(list.error);
      expect(list.projects.some((p) => p.path === SESSION_CWD)).toBe(true);

      // ② projects:added was broadcast
      expect(claude.receivedEvents('projects:added').length).toBeGreaterThan(0);

      // ③ DB row exists
      expect(await projectStore.getByPath(SESSION_CWD)).not.toBeNull();
    });
  });
});
