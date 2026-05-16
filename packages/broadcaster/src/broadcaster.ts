import { type Logger, NOOP_LOGGER } from '@code-quest/utils';
import type {
  Broadcaster,
  BroadcastType,
  DataSourceLike,
  SnapshotCallback,
  Unsubscribe,
} from './types.ts';

interface TypeEntry {
  source: DataSourceLike<unknown>;
  hasValue: boolean;
  lastValue: unknown;
  readPromise: Promise<unknown> | null;
  unsub: Unsubscribe;
}

interface CwdEntry {
  types: Map<BroadcastType, TypeEntry>;
  subs: Map<string, SnapshotCallback>;
}

export class LocalBroadcaster implements Broadcaster {
  private readonly entries = new Map<string, CwdEntry>();
  private readonly factories = new Map<BroadcastType, (cwd: string) => DataSourceLike<unknown>>();
  private readonly logger: Logger;

  constructor(options?: { logger?: Logger }) {
    this.logger = options?.logger ?? NOOP_LOGGER;
  }

  add(type: BroadcastType, createSource: (cwd: string) => DataSourceLike<unknown>): this {
    this.factories.set(type, createSource);
    return this;
  }

  subscribe(cwd: string, subscriberId: string, cb: SnapshotCallback): Unsubscribe {
    let entry = this.entries.get(cwd);
    if (!entry) {
      entry = this.initCwdEntry(cwd);
    }
    entry.subs.set(subscriberId, cb);
    for (const [type, typeEntry] of entry.types) {
      this.deliverInitial(cwd, subscriberId, type, typeEntry, cb);
    }
    return () => this.unsubscribe(cwd, subscriberId);
  }

  private initCwdEntry(cwd: string): CwdEntry {
    const entry: CwdEntry = { types: new Map(), subs: new Map() };
    this.entries.set(cwd, entry);
    for (const [type, createSource] of this.factories) {
      const source = createSource(cwd);
      const typeEntry: TypeEntry = {
        source,
        hasValue: false,
        lastValue: undefined,
        readPromise: null,
        unsub: () => {},
      };
      typeEntry.unsub = source.onChange(() => this.onSourceChange(cwd, type, typeEntry));
      entry.types.set(type, typeEntry);
    }
    return entry;
  }

  private onSourceChange(cwd: string, type: BroadcastType, typeEntry: TypeEntry): void {
    if (typeEntry.readPromise) return;
    typeEntry.readPromise = typeEntry.source
      .read()
      .then((data) => {
        typeEntry.readPromise = null;
        const e = this.entries.get(cwd);
        if (!e) return data;
        const te = e.types.get(type);
        if (!te) return data;
        te.hasValue = true;
        te.lastValue = data;
        for (const sub of e.subs.values()) sub(type, data);
        return data;
      })
      .catch((err: unknown) => {
        typeEntry.readPromise = null;
        this.logger.error({ err, type }, 'Broadcaster: read failed on change');
      });
  }

  private deliverInitial(
    cwd: string,
    subscriberId: string,
    type: BroadcastType,
    typeEntry: TypeEntry,
    cb: SnapshotCallback,
  ): void {
    if (typeEntry.hasValue) {
      cb(type, typeEntry.lastValue);
      return;
    }
    if (typeEntry.readPromise) {
      typeEntry.readPromise.then(() => {
        const e = this.entries.get(cwd);
        if (!e || !e.subs.has(subscriberId)) return;
        const te = e.types.get(type);
        if (!te?.hasValue) return;
        cb(type, te.lastValue);
      });
      return;
    }
    typeEntry.readPromise = typeEntry.source
      .read()
      .then((data) => {
        typeEntry.readPromise = null;
        const e = this.entries.get(cwd);
        if (!e) return data;
        const te = e.types.get(type);
        if (te) {
          te.hasValue = true;
          te.lastValue = data;
        }
        if (!e.subs.has(subscriberId)) return data;
        cb(type, data);
        return data;
      })
      .catch((err: unknown) => {
        typeEntry.readPromise = null;
        this.logger.error({ err, type }, 'Broadcaster: initial read failed');
      });
  }

  private unsubscribe(cwd: string, subscriberId: string): void {
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
  }
}
