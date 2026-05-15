// Fakes

export { FakeClaude } from './fake-claude.ts';
export type { FileTree } from './fake-filesystem-service.ts';
export { FakeFilesystemService, FakeRootGuard } from './fake-filesystem-service.ts';
export { FakeGitService } from './fake-git-service.ts';
export type { ReceivedMessageMap } from './fake-process-provider.ts';
export { FakeProcessHandle, FakeProcessProvider } from './fake-process-provider.ts';
export type { FakeSocket } from './fake-socket.ts';
export { createFakeSocket } from './fake-socket.ts';
export type { ServerConnector } from './fake-summoner.ts';
export { createFakeSummoner, FakeSummoner } from './fake-summoner.ts';
export { FakeWatchService } from './fake-watch-service.ts';
// Fixture paths
export { FIXTURES_DIR } from './fixtures.ts';
export type { SegmentBuilders } from './segment-builders.ts';
export { createSegments } from './segment-builders.ts';
// Segment builders (Node.js)
export { resetSeq, segments } from './segments-node.ts';
