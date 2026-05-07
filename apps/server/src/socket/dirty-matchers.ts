/** Predicates that classify a changed path into one of three dirty domains
 *  (fs / git / openspec). Lives in its own module so handlers don't have to
 *  cross-import each other and `container.ts` has a single source for the
 *  three DirtyBroadcaster predicates. */

/** `.git` meta paths whose changes the UI cares about (HEAD, index,
 *  packed-refs, refs/*). Object/log churn is intentionally excluded —
 *  it changes constantly for reasons the UI doesn't care about. */
const GIT_META_RE: RegExp = /^\.git\/(HEAD|index|packed-refs|refs\/.*)$/;

/** Paths the file/spec UI should ignore (vendored, build output, logs,
 *  OS metadata). `node_modules`, `dist`, `.next`, etc. */
const IGNORE_RES: RegExp[] = [
  /^node_modules(\/|$)/,
  /^\.git\/objects(\/|$)/,
  /^\.git\/logs(\/|$)/,
  /^dist(\/|$)/,
  /^build(\/|$)/,
  /^out(\/|$)/,
  /^\.next(\/|$)/,
  /^\.turbo(\/|$)/,
  /^\.parcel-cache(\/|$)/,
  /\.log$/,
  /(^|\/)\.DS_Store$/,
];

const OPENSPEC_RE = /^openspec\//;

/** "files" domain — everything NOT classified as git-meta and NOT ignored.
 *  Openspec paths intentionally match here too (file tree refresh fires
 *  alongside spec pane refresh). */
export function matchesFs(path: string): boolean {
  if (GIT_META_RE.test(path)) return false;
  for (const re of IGNORE_RES) if (re.test(path)) return false;
  return true;
}

export function matchesGit(path: string): boolean {
  return GIT_META_RE.test(path);
}

export function matchesOpenspec(path: string): boolean {
  return OPENSPEC_RE.test(path);
}
