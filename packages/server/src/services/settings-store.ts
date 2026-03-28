import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export interface SettingsStore {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  getAll(): Record<string, unknown>;
}

export class FileSettingsStore implements SettingsStore {
  private readonly dir: string;

  constructor(private readonly filePath: string) {
    this.dir = dirname(filePath);
    mkdirSync(this.dir, { recursive: true });
  }

  private readFile(): Record<string, unknown> {
    try {
      return JSON.parse(readFileSync(this.filePath, 'utf-8'));
    } catch {
      return {};
    }
  }

  get(key: string): unknown {
    return this.readFile()[key];
  }

  set(key: string, value: unknown): void {
    const data = this.readFile();
    data[key] = value;
    // Atomic write via temp file + rename
    const tmpFile = join(this.dir, `.settings-${Date.now()}.tmp`);
    writeFileSync(tmpFile, JSON.stringify(data, null, 2));
    renameSync(tmpFile, this.filePath);
  }

  getAll(): Record<string, unknown> {
    return this.readFile();
  }
}

export class InMemorySettingsStore implements SettingsStore {
  private data = new Map<string, unknown>();

  get(key: string): unknown {
    return this.data.get(key);
  }

  set(key: string, value: unknown): void {
    this.data.set(key, value);
  }

  getAll(): Record<string, unknown> {
    return Object.fromEntries(this.data);
  }
}
