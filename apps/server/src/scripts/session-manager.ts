import { sqliteMigrationsFolder, sqliteSchema } from '@code-quest/db-schema';
import { checkbox, Separator, select } from '@inquirer/prompts';
import chalk from 'chalk';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { config } from '../config.ts';
import { createContainer } from '../container.ts';
import { createDatabaseFromUrl, parseDatabaseType } from '../db/create-database.ts';
import { exportSession } from '../services/jsonl-exporter.ts';
import { importSession } from '../services/jsonl-importer.ts';
import type { RawEventService } from '../services/raw-event-service.ts';
import type { SessionStore } from '../services/session-store.ts';
import { TYPES } from '../types.ts';
import {
  type ExportableSession,
  type ImportStatus,
  type JsonlSession,
  SessionScanner,
} from './session-scanner.ts';

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return chalk.dim(`${(bytes / 1024 / 1024).toFixed(1)}MB`);
  return chalk.dim(`${Math.round(bytes / 1024)}KB`);
}

type DateGroup = 'Today' | 'This Week' | 'Older';

function getDateGroup(createdAt?: string): DateGroup {
  if (!createdAt) return 'Older';
  const d = new Date(createdAt);
  const now = new Date();
  const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 1) return 'Today';
  if (diffDays < 7) return 'This Week';
  return 'Older';
}

const IMPORT_LABEL: Record<ImportStatus, string> = {
  NOT_IMPORTED: 'NOT_IMPORTED'.padEnd(12),
  PARTIAL: chalk.yellow('PARTIAL'.padEnd(12)),
  IMPORTED: chalk.gray('IMPORTED'.padEnd(12)),
};

function formatImportSession(session: JsonlSession, status: ImportStatus): string {
  const label = IMPORT_LABEL[status];
  const date = chalk.gray((session.createdAt ?? '????-??-??').slice(0, 10));
  const size = formatSize(session.sizeBytes);
  const title = (session.title ?? session.sessionId.slice(0, 8)).slice(0, 45);
  return `${label}  ${date}  ${size.padEnd(8)}  ${title}`;
}

function formatExportSession(s: ExportableSession): string {
  const label = s.status === 'EXPORTED' ? chalk.gray(s.status.padEnd(12)) : s.status.padEnd(12);
  const date = chalk.gray((s.session.createdAt ?? '????-??-??').slice(0, 10));
  const title = (s.session.title ?? s.session.id.slice(0, 8)).slice(0, 50);
  return `${label}  ${date}  ${title}`;
}

function groupByDate<T>(items: T[], getDate: (item: T) => string | undefined) {
  const groups: { label: DateGroup; items: T[] }[] = [
    { label: 'Today', items: [] },
    { label: 'This Week', items: [] },
    { label: 'Older', items: [] },
  ];
  for (const item of items) {
    const group = getDateGroup(getDate(item));
    groups.find((g) => g.label === group)?.items.push(item);
  }
  return groups.filter((g) => g.items.length > 0);
}

async function runImport(
  scanner: SessionScanner,
  rawEventService: RawEventService,
  sessionStore: SessionStore,
): Promise<void> {
  console.log(chalk.dim('\nScanning ~/.claude/projects/ ...'));
  const projects = await scanner.scanProjects();

  if (projects.length === 0) {
    console.log('No projects found.');
    return;
  }

  while (true) {
    const projectChoice = await select({
      message: `Select a project  ${chalk.dim('[import mode]')}`,
      choices: [
        ...projects.map((p) => ({
          name: `${p.cwd}   ${chalk.gray(`${String(p.sessions.length)} sessions`)} · ${
            p.notImportedCount > 0
              ? chalk.yellow(`${p.notImportedCount} not imported`)
              : chalk.gray('all imported')
          }`,
          value: p,
        })),
        new Separator(),
        { name: chalk.dim('← Back'), value: null },
      ],
    });

    if (!projectChoice) break;

    console.log(chalk.dim('\nLoading session statuses...'));
    const sessionStatuses = await Promise.all(
      projectChoice.sessions.map(async (s) => {
        const dbCount = await scanner.getDbCount(s.sessionId);
        const status = await scanner.getImportStatus(s, dbCount);
        return { session: s, status };
      }),
    );

    const groups = groupByDate(sessionStatuses, ({ session }) => session.createdAt);
    const choices: Array<unknown> = [];
    for (const group of groups) {
      choices.push(new Separator(chalk.bold(`──── ${group.label} ────`)));
      for (const { session, status } of group.items) {
        choices.push({
          name: formatImportSession(session, status),
          value: session,
          checked: status === 'NOT_IMPORTED' || status === 'PARTIAL',
          disabled: status === 'IMPORTED' ? chalk.gray('(already imported)') : false,
        });
      }
    }
    choices.push(new Separator());
    choices.push({ name: chalk.dim('← Back'), value: null });

    const toImport = await checkbox({
      message: `${projectChoice.cwd} — select sessions to import`,
      choices,
    });

    const selected = toImport.filter((s): s is JsonlSession => s !== null);
    if (selected.length === 0) continue;

    console.log(`\nImporting ${selected.length} session(s)...`);
    for (const session of selected) {
      process.stdout.write(`  ${chalk.dim(session.sessionId.slice(0, 8))}... `);
      await importSession(session.jsonlPath, rawEventService, sessionStore);
      console.log(chalk.green('✓'));
    }
    console.log(chalk.green(`\nDone. ${selected.length} session(s) imported.\n`));
  }
}

async function runExport(
  scanner: SessionScanner,
  rawEventService: RawEventService,
  sessionStore: SessionStore,
): Promise<void> {
  console.log(chalk.dim('\nLoading exportable sessions...'));
  const projects = await scanner.scanExportable();

  if (projects.length === 0) {
    console.log('No exportable sessions found.');
    return;
  }

  while (true) {
    const projectChoice = await select({
      message: `Select a project  ${chalk.dim('[export mode]')}`,
      choices: [
        ...projects.map((p) => ({
          name: `${p.cwd}   ${chalk.gray(`${String(p.sessions.length)} sessions`)} · ${
            p.notExportedCount > 0
              ? chalk.cyan(`${p.notExportedCount} exportable`)
              : chalk.gray('all exported')
          }`,
          value: p,
        })),
        new Separator(),
        { name: chalk.dim('← Back'), value: null },
      ],
    });

    if (!projectChoice) break;

    const exportGroups = groupByDate(projectChoice.sessions, (s) => s.session.createdAt);
    const exportChoices: Array<unknown> = [];
    for (const group of exportGroups) {
      exportChoices.push(new Separator(chalk.bold(`──── ${group.label} ────`)));
      for (const s of group.items) {
        exportChoices.push({
          name: formatExportSession(s),
          value: s,
          checked: s.status === 'NOT_EXPORTED',
          disabled: s.status === 'EXPORTED' ? chalk.gray('(already exported)') : false,
        });
      }
    }
    exportChoices.push(new Separator());
    exportChoices.push({ name: chalk.dim('← Back'), value: null });

    const toExport = await checkbox({
      message: `${projectChoice.cwd} — select sessions to export`,
      choices: exportChoices,
    });

    const selected = toExport.filter((s): s is ExportableSession => s !== null);
    if (selected.length === 0) continue;

    console.log(`\nExporting ${selected.length} session(s)...`);
    for (const s of selected) {
      process.stdout.write(`  ${chalk.dim(s.session.id.slice(0, 8))}... `);
      await exportSession(s.session.id, s.jsonlPath, rawEventService, sessionStore);
      console.log(chalk.green('✓'));
    }
    console.log(chalk.green(`\nDone. ${selected.length} session(s) exported.\n`));
  }
}

async function main() {
  const sqliteUrl = config.database.find((url) => parseDatabaseType(url) === 'sqlite');
  if (!sqliteUrl) throw new Error('No SQLite database configured');

  const entry = createDatabaseFromUrl(sqliteUrl);
  if (entry.type !== 'sqlite') throw new Error('Expected SQLite');
  migrate(entry.db, { migrationsFolder: sqliteMigrationsFolder });

  const container = createContainer({
    storeConfig: { databases: [{ ...entry, schema: sqliteSchema }] },
    rawEvents: { writeDeltas: false, readDeltas: false },
  });

  const rawEventService = container.get<RawEventService>(TYPES.RawEventService);
  const sessionStore = container.get<SessionStore>(TYPES.SessionStore);
  const scanner = new SessionScanner(rawEventService, sessionStore);

  console.log(chalk.bold.cyan('\n── Session Manager ──\n'));

  while (true) {
    const action = await select({
      message: 'What do you want to do?',
      choices: [
        { name: `Import  ${chalk.dim('JSONL → DB')}`, value: 'import' },
        { name: `Export  ${chalk.dim('DB → JSONL')}`, value: 'export' },
        new Separator(),
        { name: 'Exit', value: 'exit' },
      ],
    });

    if (action === 'exit') break;
    if (action === 'import') await runImport(scanner, rawEventService, sessionStore);
    if (action === 'export') await runExport(scanner, rawEventService, sessionStore);
  }

  console.log(chalk.dim('\nBye.\n'));
}

main().catch((e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e);
  // inquirer throws ExitPromptError on Ctrl+C — exit silently
  if (msg.includes('force closed') || msg.includes('ExitPromptError')) process.exit(0);
  console.error(e);
  process.exit(1);
});
