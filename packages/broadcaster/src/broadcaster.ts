import type { DataSource, Unsubscribe } from './types.ts';

interface Entry<T> {
  source: DataSource<T>;
  lastValue: T | null;
  subs: Map<string, (v: T) => void>;
  unsub: Unsubscribe;
}

export class Broadcaster<T> {
  private readonly entries = new Map<string, Entry<T>>();
  private readonly createSource: (cwd: string) => DataSource<T>;

  constructor(createSource: (cwd: string) => DataSource<T>) {
    this.createSource = createSource;
  }

  subscribe(cwd: string, subscriberId: string, cb: (value: T) => void): Unsubscribe {
    let entry = this.entries.get(cwd);
    if (!entry) {
      const source = this.createSource(cwd);
      entry = { source, lastValue: null, subs: new Map(), unsub: () => {} };
      this.entries.set(cwd, entry);
      entry.unsub = source.onChange(() => {
        void source.read().then((v) => {
          const e = this.entries.get(cwd);
          if (!e) return;
          e.lastValue = v;
          for (const sub of e.subs.values()) sub(v);
        });
      });
    }

    entry.subs.set(subscriberId, cb);

    if (entry.lastValue !== null) {
      cb(entry.lastValue);
    } else {
      void entry.source.read().then((v) => {
        const e = this.entries.get(cwd);
        if (!e) return;
        e.lastValue = v;
        cb(v);
      });
    }

    return () => {
      const e = this.entries.get(cwd);
      if (!e) return;
      e.subs.delete(subscriberId);
      if (e.subs.size === 0) {
        e.unsub();
        e.source.dispose?.();
        this.entries.delete(cwd);
      }
    };
  }
}
