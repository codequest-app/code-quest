import { readFileSync } from 'node:fs';
import { basename, normalize, resolve } from 'node:path';
import { fileListPayloadSchema, fileReadPayloadSchema } from '@code-quest/shared';
import Fuse from 'fuse.js';
import { globSync } from 'glob';
import { logger } from '../../logger.ts';
import type { Channel } from '../channel.ts';
import { type ChannelEmitter, withChannel, withError } from '../channel-emitter.ts';
import type { ChannelManager } from '../channel-manager.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';

type FileResult = { path: string; name: string; type: 'file' | 'directory' | 'terminal' };

const MAX_RESULTS = 20;
const IGNORE_DIRS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/coverage/**',
  '**/logs/**',
];

/** List all files in cwd (glob --files equivalent). Returns relative paths. */
function getAllFiles(cwd: string): string[] {
  return globSync('**/*', {
    cwd,
    dot: true,
    ignore: IGNORE_DIRS,
    nodir: true,
    maxDepth: 10,
  });
}

/** Extract unique directory paths from file list. */
function extractDirectories(files: string[]): string[] {
  const dirs = new Set<string>();
  for (const f of files) {
    let idx = f.indexOf('/');
    while (idx !== -1) {
      dirs.add(f.substring(0, idx));
      idx = f.indexOf('/', idx + 1);
    }
  }
  return [...dirs].map((d) => `${d}/`);
}

/** Empty pattern → list root-level entries only (first segment). */
function listRootEntries(files: string[], dirs: string[]): FileResult[] {
  const seen = new Set<string>();
  const results: FileResult[] = [];

  for (const d of dirs) {
    const root = d.split('/')[0];
    if (root && !seen.has(root)) {
      seen.add(root);
      results.push({ path: `${root}/`, name: root, type: 'directory' });
    }
  }

  for (const f of files) {
    if (!f.includes('/') && !seen.has(f)) {
      seen.add(f);
      results.push({ path: f, name: f, type: 'file' });
    }
  }

  return results.sort((a, b) => a.path.localeCompare(b.path)).slice(0, MAX_RESULTS);
}

/** Pattern ends with `/` → list entries inside that directory. */
function listDirectory(prefix: string, files: string[], dirs: string[]): FileResult[] {
  const seen = new Set<string>();
  const results: FileResult[] = [];
  const prefixLower = prefix.toLowerCase();

  for (const d of dirs) {
    if (!d.toLowerCase().startsWith(prefixLower)) continue;
    const rest = d.slice(prefix.length);
    const segment = rest.split('/')[0];
    if (segment && !seen.has(segment)) {
      seen.add(segment);
      results.push({ path: `${prefix}${segment}/`, name: segment, type: 'directory' });
    }
  }

  for (const f of files) {
    if (!f.toLowerCase().startsWith(prefixLower)) continue;
    const rest = f.slice(prefix.length);
    if (!rest.includes('/') && !seen.has(rest)) {
      seen.add(rest);
      results.push({ path: f, name: basename(f), type: 'file' });
    }
  }

  return results.sort((a, b) => a.path.localeCompare(b.path)).slice(0, MAX_RESULTS);
}

/** Fuzzy search across all files + directories. */
function fuzzySearch(pattern: string, files: string[], dirs: string[]): FileResult[] {
  const items = [
    ...files.map((f) => ({ path: f, filename: basename(f), isDirectory: false })),
    ...dirs.map((d) => ({ path: d, filename: basename(d.slice(0, -1)), isDirectory: true })),
  ];

  const fuse = new Fuse(items, {
    includeScore: true,
    threshold: 0.5,
    keys: [
      { name: 'path', weight: 1 },
      { name: 'filename', weight: 2 },
    ],
  });

  return fuse.search(pattern, { limit: MAX_RESULTS }).map((r) => ({
    path: r.item.path,
    name: r.item.filename,
    type: (r.item.isDirectory ? 'directory' : 'file') as 'file' | 'directory',
  }));
}

export function create(channelManager: ChannelManager, emitter: ChannelEmitter): void {
  function handleRead(
    ch: Channel,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): void {
    const { filePath } = fileReadPayloadSchema.parse(payload);
    const cwd = ch.cwd;
    const absolute = resolve(cwd, normalize(filePath));
    if (!absolute.startsWith(`${cwd}/`) && absolute !== cwd) {
      callback?.({ error: 'Path traversal not allowed' });
      return;
    }
    try {
      const content = readFileSync(absolute, 'utf-8');
      callback?.({ content });
    } catch (err) {
      logger.warn({ err, filePath }, 'Failed to read file');
      callback?.({ error: `File not found: ${filePath}` });
    }
  }

  function listTerminals(pattern: string): FileResult[] {
    const results: FileResult[] = [];
    for (const routingId of channelManager.getAllChannelIds()) {
      if (!pattern || routingId.toLowerCase().includes(pattern)) {
        results.push({ type: 'terminal', path: routingId, name: routingId });
      }
    }
    return results;
  }

  function handleList(
    ch: Channel,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): void {
    try {
      const { pattern } = fileListPayloadSchema.parse(payload);
      const cwd = ch.cwd;

      const allFiles = getAllFiles(cwd);
      const allDirs = extractDirectories(allFiles);

      let fileResults: FileResult[];
      if (!pattern) {
        fileResults = listRootEntries(allFiles, allDirs);
      } else if (pattern.endsWith('/')) {
        fileResults = listDirectory(pattern, allFiles, allDirs);
      } else {
        fileResults = fuzzySearch(pattern.toLowerCase(), allFiles, allDirs);
      }

      const combined = [...fileResults, ...listTerminals(pattern.toLowerCase())].slice(
        0,
        MAX_RESULTS,
      );
      callback?.({ files: combined });
    } catch (err) {
      logger.warn({ err }, 'Failed to list files');
      callback?.({ files: [] });
    }
  }

  emitter.on('file:read', withError(withChannel(handleRead)));
  emitter.on('file:list', withChannel(handleList));
}
