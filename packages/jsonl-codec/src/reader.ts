import type { RawEvent } from '@code-quest/summoner';

export interface JsonlSessionRecord {
  id: string;
  channelId: string;
  provider: string;
  command: string;
  args: string;
  cwd: string;
  projectRoot: string;
  mode: string;
  role: string;
  createdAt: string;
}

interface JsonlEntry {
  type: string;
  isSidechain?: boolean;
  sessionId?: string;
  timestamp?: string;
  cwd?: string;
  snapshot?: { timestamp?: string };
  [key: string]: unknown;
}

const SESSION_DEFAULTS = {
  channelId: (id: string) => id,
  provider: 'claude',
  command: 'claude',
  args: '[]',
  mode: 'interactive',
  role: 'chat',
} as const;

function parseLine(line: string): JsonlEntry | null {
  if (!line.trim()) return null;
  try {
    const entry = JSON.parse(line) as JsonlEntry;
    if (typeof entry.type !== 'string') return null;
    return entry.isSidechain ? null : entry;
  } catch {
    return null;
  }
}

function parseTimestamp(s: string | undefined): number | null {
  if (s == null) return null;
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t;
}

function resolveTimestamp(entry: JsonlEntry, fallback: number): number {
  return parseTimestamp(entry.timestamp) ?? parseTimestamp(entry.snapshot?.timestamp) ?? fallback;
}

export class JsonlReader {
  private lastTimestamp = 0;
  private readonly fallbackSessionId: string;

  constructor(fallbackSessionId: string) {
    this.fallbackSessionId = fallbackSessionId;
  }

  readLine(line: string): RawEvent | null {
    const entry = parseLine(line);
    if (!entry) return null;

    const sessionId = entry.sessionId ?? this.fallbackSessionId;
    const timestamp = resolveTimestamp(entry, this.lastTimestamp || Date.now());
    if (timestamp > 0) this.lastTimestamp = timestamp;

    return { sessionId, direction: 'out', raw: line, timestamp };
  }

  extractSessionRecord(lines: string[]): JsonlSessionRecord {
    for (const line of lines) {
      const entry = parseLine(line);
      if (!entry?.sessionId || !entry.cwd || !entry.timestamp) continue;
      return {
        id: entry.sessionId,
        channelId: entry.sessionId,
        provider: SESSION_DEFAULTS.provider,
        command: SESSION_DEFAULTS.command,
        args: SESSION_DEFAULTS.args,
        cwd: entry.cwd,
        projectRoot: entry.cwd,
        mode: SESSION_DEFAULTS.mode,
        role: SESSION_DEFAULTS.role,
        createdAt: entry.timestamp,
      };
    }
    return {
      id: this.fallbackSessionId,
      channelId: this.fallbackSessionId,
      provider: SESSION_DEFAULTS.provider,
      command: SESSION_DEFAULTS.command,
      args: SESSION_DEFAULTS.args,
      cwd: '',
      projectRoot: '',
      mode: SESSION_DEFAULTS.mode,
      role: SESSION_DEFAULTS.role,
      createdAt: new Date().toISOString(),
    };
  }
}
