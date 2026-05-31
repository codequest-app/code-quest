// decodeProjectDir used as fallback when JSONL has no cwd field
import { access, createReadStream } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';
import { createInterface } from 'node:readline';
import { decodeProjectDir, encodeProjectDir, JsonlReader } from '@code-quest/jsonl-codec';
import type { RawEventService } from '../services/raw-event-service.ts';
import type { SessionRecord, SessionStore } from '../services/session-store.ts';

export type ImportStatus = 'NOT_IMPORTED' | 'IMPORTED' | 'PARTIAL';
export type ExportStatus = 'NOT_EXPORTED' | 'EXPORTED';

export interface JsonlSession {
  sessionId: string;
  jsonlPath: string;
  title?: string;
  createdAt?: string;
  cwd: string;
  sizeBytes: number;
}

export interface ExportableSession {
  session: SessionRecord;
  jsonlPath: string;
  status: ExportStatus;
}

export interface ExportableProject {
  cwd: string;
  sessions: ExportableSession[];
  notExportedCount: number;
}

export interface ProjectInfo {
  cwd: string;
  encodedDir: string;
  sessions: JsonlSession[];
  notImportedCount: number;
}

async function readFirstLines(filePath: string, maxLines = 20): Promise<string[]> {
  const lines: string[] = [];
  await new Promise<void>((resolve) => {
    const rl = createInterface({
      input: createReadStream(filePath, { encoding: 'utf-8' }),
      crlfDelay: Infinity,
    });
    rl.on('line', (line) => {
      if (line.trim()) lines.push(line);
      if (lines.length >= maxLines) rl.close();
    });
    rl.on('close', resolve);
    rl.on('error', resolve);
  });
  return lines;
}

async function countJsonlLines(filePath: string): Promise<number> {
  let count = 0;
  await new Promise<void>((resolve) => {
    const reader = new JsonlReader(basename(filePath, '.jsonl'));
    const rl = createInterface({
      input: createReadStream(filePath, { encoding: 'utf-8' }),
      crlfDelay: Infinity,
    });
    rl.on('line', (line) => {
      if (reader.readLine(line) !== null) count++;
    });
    rl.on('close', resolve);
    rl.on('error', resolve);
  });
  return count;
}

export class SessionScanner {
  private readonly claudeProjectsDir: string;
  private readonly rawEventService: RawEventService;
  private readonly sessionStore: SessionStore;

  constructor(
    rawEventService: RawEventService,
    sessionStore: SessionStore,
    claudeProjectsDir?: string,
  ) {
    this.rawEventService = rawEventService;
    this.sessionStore = sessionStore;
    this.claudeProjectsDir = claudeProjectsDir ?? join(homedir(), '.claude', 'projects');
  }

  async scanProjects(): Promise<ProjectInfo[]> {
    let entries: string[];
    try {
      entries = await readdir(this.claudeProjectsDir);
    } catch {
      return [];
    }

    // fetch all imported session ids once to avoid N DB queries
    const { sessions: importedSessions } = await this.sessionStore.list({ limit: 10000 });
    const importedIds = new Set(importedSessions.map((s) => s.id));

    const projects: ProjectInfo[] = [];

    for (const entry of entries) {
      const projectPath = join(this.claudeProjectsDir, entry);
      const info = await stat(projectPath).catch(() => null);
      if (!info?.isDirectory()) continue;

      const sessions = await this.scanSessions(projectPath);
      if (sessions.length === 0) continue;

      // use cwd from first session's JSONL entry (avoids literal-dash ambiguity in directory name)
      const cwd = sessions[0]?.cwd ?? decodeProjectDir(entry);
      const notImportedCount = sessions.filter((s) => !importedIds.has(s.sessionId)).length;

      projects.push({ cwd, encodedDir: entry, sessions, notImportedCount });
    }

    return projects.sort((a, b) => b.sessions.length - a.sessions.length);
  }

  private async scanSessions(projectPath: string): Promise<JsonlSession[]> {
    let files: string[];
    try {
      files = await readdir(projectPath);
    } catch {
      return [];
    }

    const sessions: JsonlSession[] = [];

    for (const file of files) {
      if (!file.endsWith('.jsonl')) continue;
      if (file.startsWith('agent-')) continue;

      const jsonlPath = join(projectPath, file);
      const sessionId = basename(file, '.jsonl');
      const lines = await readFirstLines(jsonlPath);

      let title: string | undefined;
      let createdAt: string | undefined;
      let cwd = '';

      for (const line of lines) {
        try {
          const d = JSON.parse(line) as Record<string, unknown>;
          if (d.type === 'ai-title' && typeof d.aiTitle === 'string') title = d.aiTitle;
          if (!createdAt && d.timestamp && typeof d.timestamp === 'string') createdAt = d.timestamp;
          if (!cwd && typeof d.cwd === 'string') cwd = d.cwd;
        } catch {}
      }

      const fileInfo = await stat(jsonlPath).catch(() => null);
      sessions.push({
        sessionId,
        jsonlPath,
        title,
        createdAt,
        cwd,
        sizeBytes: fileInfo?.size ?? 0,
      });
    }

    return sessions.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  }

  async getImportStatus(session: JsonlSession, dbCount: number): Promise<ImportStatus> {
    if (dbCount === 0) return 'NOT_IMPORTED';
    const jsonlCount = await countJsonlLines(session.jsonlPath);
    return dbCount >= jsonlCount * 0.95 ? 'IMPORTED' : 'PARTIAL';
  }

  async getDbCount(sessionId: string): Promise<number> {
    const events = await this.rawEventService.getBySession(sessionId);
    return events.length;
  }

  async scanExportable(): Promise<ExportableProject[]> {
    const { sessions, total } = await this.sessionStore.list({ limit: 1000 });
    if (total === 0) return [];

    const byCwd = new Map<string, SessionRecord[]>();
    for (const s of sessions) {
      const cwd = s.cwd ?? s.projectRoot;
      if (!cwd) continue;
      const list = byCwd.get(cwd) ?? [];
      list.push(s);
      byCwd.set(cwd, list);
    }

    const projects: ExportableProject[] = [];

    for (const [cwd, cwdSessions] of byCwd) {
      const encodedDir = encodeProjectDir(cwd);
      const projectDir = join(this.claudeProjectsDir, encodedDir);

      const exportable: ExportableSession[] = [];
      for (const s of cwdSessions) {
        const jsonlPath = join(projectDir, `${s.id}.jsonl`);
        const exists = await new Promise<boolean>((resolve) => {
          access(jsonlPath, (err) => resolve(!err));
        });
        exportable.push({
          session: s,
          jsonlPath,
          status: (exists ? 'EXPORTED' : 'NOT_EXPORTED') as ExportStatus,
        });
      }

      const notExportedCount = exportable.filter((e) => e.status === 'NOT_EXPORTED').length;
      projects.push({ cwd, sessions: exportable, notExportedCount });
    }

    return projects
      .filter((p) => p.sessions.length > 0)
      .sort((a, b) => b.sessions.length - a.sessions.length);
  }
}
