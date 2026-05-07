export interface SettingsStore {
  get(provider: string, key: string): Promise<unknown>;
  set(provider: string, key: string, value: unknown): Promise<void>;
  getMany(provider: string, keys: string[]): Promise<Record<string, unknown>>;
}
