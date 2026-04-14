import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { logger } from '../logger.ts';

export interface SettingsStore {
  get(provider: string, key: string): Promise<unknown>;
  set(provider: string, key: string, value: unknown): Promise<void>;
  getMany(provider: string, keys: string[]): Promise<Record<string, unknown>>;
}

export class FileSettingsStore implements SettingsStore {
  private readonly dir: string;

  constructor(private readonly filePath: string) {
    this.dir = dirname(filePath);
    mkdirSync(this.dir, { recursive: true });
  }

  private readFile(): Record<string, Record<string, unknown>> {
    try {
      return JSON.parse(readFileSync(this.filePath, 'utf-8'));
    } catch (err) {
      logger.debug(err, 'Failed to read settings file');
      return {};
    }
  }

  private writeFile(data: Record<string, Record<string, unknown>>): void {
    const tmpFile = join(this.dir, `.settings-${Date.now()}.tmp`);
    writeFileSync(tmpFile, JSON.stringify(data, null, 2));
    renameSync(tmpFile, this.filePath);
  }

  async get(provider: string, key: string): Promise<unknown> {
    return this.readFile()[provider]?.[key];
  }

  async set(provider: string, key: string, value: unknown): Promise<void> {
    const data = this.readFile();
    if (!data[provider]) data[provider] = {};
    data[provider][key] = value;
    this.writeFile(data);
  }

  async getMany(provider: string, keys: string[]): Promise<Record<string, unknown>> {
    const providerData = this.readFile()[provider] ?? {};
    const result: Record<string, unknown> = {};
    for (const key of keys) {
      if (key in providerData) result[key] = providerData[key];
    }
    return result;
  }
}
