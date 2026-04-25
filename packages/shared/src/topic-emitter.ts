/**
 * Generic topic-keyed pub/sub. Each `(topic, subscriberId)` pair holds at
 * most one stored callback (the latest subscribe wins) but is refcounted —
 * subscribing twice under the same id keeps the entry alive until BOTH
 * unsubscribes have fired. This matters when two unrelated callsites
 * (e.g. fs:watch handler and ChannelManager join) both register the same
 * socket as a subscriber for the same cwd: each gets its own idempotent
 * unsubscribe, and the entry only dies when both have released.
 *
 * `unsubscribe` returned from `subscribe` is idempotent; calling it twice
 * is a no-op.
 *
 * `publish` isolates exceptions per subscriber: one throw doesn't block
 * the rest. The thrown error is logged via `console.error`.
 */
interface Entry<Payload> {
  cb: (p: Payload) => void;
  refcount: number;
}

export class TopicEmitter<Topic, Payload> {
  private readonly subs = new Map<Topic, Map<string, Entry<Payload>>>();

  subscribe(topic: Topic, subscriberId: string, cb: (p: Payload) => void): () => void {
    let perTopic = this.subs.get(topic);
    if (!perTopic) {
      perTopic = new Map();
      this.subs.set(topic, perTopic);
    }
    const entry = perTopic.get(subscriberId);
    if (entry) {
      // Latest callback wins. Two callsites with same id usually share the
      // same intent (e.g. socket.emit), so the difference is moot — we keep
      // the most recent registration.
      entry.cb = cb;
      entry.refcount += 1;
    } else {
      perTopic.set(subscriberId, { cb, refcount: 1 });
    }
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      const m = this.subs.get(topic);
      if (!m) return;
      const e = m.get(subscriberId);
      if (!e) return;
      e.refcount -= 1;
      if (e.refcount <= 0) {
        m.delete(subscriberId);
        if (m.size === 0) this.subs.delete(topic);
      }
    };
  }

  publish(topic: Topic, payload: Payload): void {
    const m = this.subs.get(topic);
    if (!m) return;
    for (const entry of m.values()) {
      try {
        entry.cb(payload);
      } catch (err) {
        console.error('[TopicEmitter] subscriber threw:', err);
      }
    }
  }

  hasSubscribers(topic: Topic): boolean {
    const m = this.subs.get(topic);
    return !!m && m.size > 0;
  }
}
