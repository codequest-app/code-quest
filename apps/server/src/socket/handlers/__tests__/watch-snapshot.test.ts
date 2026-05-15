import { EVENTS } from '@code-quest/schemas';
import { FakeWatchService } from '@code-quest/test-kit';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTestContainer } from '../../../test/create-test-container.ts';
import { createFakeServer } from '../../../test/fake-server.ts';

describe('fs:watch snapshot integration', () => {
  let watch: FakeWatchService;

  beforeEach(() => {
    watch = new FakeWatchService();
  });

  function setup() {
    const container = createTestContainer({ watchService: watch });
    const server = createFakeServer(container);
    const conn = server.connect();
    conn.filesystem.setRoots(['/repo']);
    conn.filesystem.addFile('/repo/src/foo.ts', 'export {}');
    return { socket: conn.socket, filesystem: conn.filesystem };
  }

  function receivedEvents(socket: ReturnType<typeof setup>['socket'], event: string) {
    return socket.listeners('to-client').length > 0
      ? []
      : ((socket as unknown as { _received: Array<[string, unknown]> })._received ?? []);
  }

  function serverSideEmits(socket: ReturnType<typeof setup>['socket'], event: string) {
    // FakeSocket records server→client via serverSocket.emit interception in FakeSummoner.
    // For raw socket access we watch the serverSocket directly.
    const recorded: unknown[] = [];
    const origEmit = socket.serverSocket.emit.bind(socket.serverSocket);
    socket.serverSocket.emit = (ev: string, ...args: unknown[]) => {
      if (ev === event) recorded.push(args[0]);
      return origEmit(ev, ...args);
    };
    return recorded;
  }

  it('after fs:watch, initial snapshot is pushed on subscribe', async () => {
    const { socket } = setup();
    const snapshots = serverSideEmits(socket, EVENTS.fs.dirty);

    socket.emit('fs:watch', { cwd: '/repo', subscriberId: 'sub-1' }, () => {});

    await vi.waitUntil(() => snapshots.length > 0, { timeout: 500 });

    expect(snapshots[0]).toMatchObject({ cwd: '/repo' });
    expect((snapshots[0] as { snapshot?: unknown }).snapshot).toBeDefined();
  });

  it('after fs:watch, file change triggers files:dirty with snapshot', async () => {
    const { socket } = setup();
    const snapshots = serverSideEmits(socket, EVENTS.fs.dirty);

    socket.emit('fs:watch', { cwd: '/repo', subscriberId: 'sub-1' }, () => {});
    await vi.waitUntil(() => snapshots.length > 0, { timeout: 500 });

    watch.simulate('/repo', { type: 'change', path: 'src/foo.ts' });
    await vi.waitUntil(() => snapshots.length > 1, { timeout: 500 });

    const last = snapshots[snapshots.length - 1] as Record<string, unknown>;
    expect(last.cwd).toBe('/repo');
    expect(Array.isArray(last.snapshot)).toBe(true);
  });

  it('after fs:watch, git HEAD change triggers git:dirty with snapshot', async () => {
    const { socket } = setup();
    const gitSnapshots = serverSideEmits(socket, EVENTS.git.dirty);

    socket.emit('fs:watch', { cwd: '/repo', subscriberId: 'sub-1' }, () => {});

    watch.simulate('/repo', { type: 'change', path: '.git/HEAD' });
    await vi.waitUntil(() => gitSnapshots.length > 0, { timeout: 500 });

    const last = gitSnapshots[0] as Record<string, unknown>;
    expect(last.cwd).toBe('/repo');
    expect(last.snapshot).toHaveProperty('branch');
  });

  it('after fs:watch, openspec change triggers openspec:dirty with snapshot', async () => {
    const { socket } = setup();
    const openspecSnapshots = serverSideEmits(socket, EVENTS.openspec.dirty);

    socket.emit('fs:watch', { cwd: '/repo', subscriberId: 'sub-1' }, () => {});

    watch.simulate('/repo', { type: 'change', path: 'openspec/changes/foo/design.md' });
    await vi.waitUntil(() => openspecSnapshots.length > 0, { timeout: 500 });

    const last = openspecSnapshots[0] as Record<string, unknown>;
    expect(last.cwd).toBe('/repo');
    expect(last.snapshot).toBeDefined();
  });

  it('fs:unwatch stops snapshot delivery', async () => {
    const { socket } = setup();
    const snapshots = serverSideEmits(socket, EVENTS.fs.dirty);

    socket.emit('fs:watch', { cwd: '/repo', subscriberId: 'sub-1' }, () => {});
    await vi.waitUntil(() => snapshots.length > 0, { timeout: 500 });

    socket.emit('fs:unwatch', { subscriberId: 'sub-1' }, () => {});
    await new Promise((r) => setTimeout(r, 20));

    const countBefore = snapshots.length;
    watch.simulate('/repo', { type: 'change', path: 'src/bar.ts' });
    await new Promise((r) => setTimeout(r, 50));

    expect(snapshots.length).toBe(countBefore);
  });

  it('two subscribers on same cwd both receive initial snapshot', async () => {
    const { socket } = setup();
    const snapshots = serverSideEmits(socket, EVENTS.fs.dirty);

    socket.emit('fs:watch', { cwd: '/repo', subscriberId: 'sub-1' }, () => {});
    await vi.waitUntil(() => snapshots.length > 0, { timeout: 500 });

    socket.emit('fs:watch', { cwd: '/repo', subscriberId: 'sub-2' }, () => {});
    await vi.waitUntil(() => snapshots.length > 1, { timeout: 500 });

    expect(snapshots[1]).toMatchObject({ cwd: '/repo' });
    expect((snapshots[1] as { snapshot?: unknown }).snapshot).toBeDefined();
  });

  it('unwatch one subscriber does not stop delivery to the other', async () => {
    const { socket } = setup();
    const snapshots = serverSideEmits(socket, EVENTS.fs.dirty);

    socket.emit('fs:watch', { cwd: '/repo', subscriberId: 'sub-1' }, () => {});
    socket.emit('fs:watch', { cwd: '/repo', subscriberId: 'sub-2' }, () => {});
    await vi.waitUntil(() => snapshots.length >= 2, { timeout: 500 });

    socket.emit('fs:unwatch', { subscriberId: 'sub-1' }, () => {});
    await new Promise((r) => setTimeout(r, 20));

    const countBefore = snapshots.length;
    watch.simulate('/repo', { type: 'change', path: 'src/bar.ts' });
    await vi.waitUntil(() => snapshots.length > countBefore, { timeout: 500 });

    expect(snapshots.length).toBe(countBefore + 1);
  });
});
