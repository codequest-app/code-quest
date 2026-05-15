import type { DataSource, Unsubscribe } from './types.ts';

type SnapshotCallback = (type: string, data: unknown) => void;

interface TypeEntry {
  source: DataSource<unknown>;
  lastValue: unknown | null;
  unsub: Unsubscribe;
}

interface CwdEntry {
  types: Map<string, TypeEntry>;
  subs: Map<string, SnapshotCallback>;
}

export class Broadcaster {
  private readonly entries = new Map<string, CwdEntry>();
  private readonly factories = new Map<string, (cwd: string) => DataSource<unknown>>();

  add(type: string, createSource: (cwd: string) => DataSource<unknown>): this {
    this.factories.set(type, createSource);
    return this;
  }

  subscribe(cwd: string, subscriberId: string, cb: SnapshotCallback): Unsubscribe {
    let entry = this.entries.get(cwd);
    if (!entry) {
      entry = { types: new Map(), subs: new Map() };
      this.entries.set(cwd, entry);
      for (const [type, createSource] of this.factories) {
        const source = createSource(cwd);
        const typeEntry: TypeEntry = { source, lastValue: null, unsub: () => {} };
        typeEntry.unsub = source.onChange(() => {
          void source.read().then((data) => {
            const e = this.entries.get(cwd);
            if (!e) return;
            const te = e.types.get(type);
            if (!te) return;
            te.lastValue = data;
            for (const sub of e.subs.values()) sub(type, data);
          });
        });
        entry.types.set(type, typeEntry);
      }
    }

    entry.subs.set(subscriberId, cb);

    for (const [type, typeEntry] of entry.types) {
      if (typeEntry.lastValue !== null) {
        cb(type, typeEntry.lastValue);
      } else {
        void typeEntry.source.read().then((data) => {
          const e = this.entries.get(cwd);
          if (!e) return;
          const te = e.types.get(type);
          if (!te) return;
          te.lastValue = data;
          cb(type, data);
        });
      }
    }

    return () => {
      const e = this.entries.get(cwd);
      if (!e) return;
      e.subs.delete(subscriberId);
      if (e.subs.size === 0) {
        for (const te of e.types.values()) {
          te.unsub();
          te.source.dispose?.();
        }
        this.entries.delete(cwd);
      }
    };
  }
}
