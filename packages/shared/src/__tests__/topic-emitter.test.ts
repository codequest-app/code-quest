import { describe, expect, it, vi } from 'vitest';
import { TopicEmitter } from '../topic-emitter.ts';

describe('TopicEmitter', () => {
  it('subscribe + publish → callback fires with payload', () => {
    const e = new TopicEmitter<string, number>();
    const cb = vi.fn();
    e.subscribe('t1', 's1', cb);
    e.publish('t1', 42);
    expect(cb).toHaveBeenCalledWith(42);
  });

  it('two subscribers same topic → both fire; unrelated topic → only matching fires', () => {
    const e = new TopicEmitter<string, string>();
    const a = vi.fn();
    const b = vi.fn();
    const c = vi.fn();
    e.subscribe('t1', 'a', a);
    e.subscribe('t1', 'b', b);
    e.subscribe('t2', 'c', c);
    e.publish('t1', 'hello');
    expect(a).toHaveBeenCalledWith('hello');
    expect(b).toHaveBeenCalledWith('hello');
    expect(c).not.toHaveBeenCalled();
  });

  it('same subscriberId subscribing twice for same topic → only one delivery', () => {
    const e = new TopicEmitter<string, void>();
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    e.subscribe('t1', 'sameId', cb1);
    e.subscribe('t1', 'sameId', cb2); // replaces or dedups
    e.publish('t1', undefined);
    // Total delivery count to the (topic, subscriberId) pair is 1
    expect(cb1.mock.calls.length + cb2.mock.calls.length).toBe(1);
  });

  it('unsubscribe stops further delivery', () => {
    const e = new TopicEmitter<string, void>();
    const cb = vi.fn();
    const off = e.subscribe('t1', 's1', cb);
    e.publish('t1', undefined);
    off();
    e.publish('t1', undefined);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('refcounted: same id N subscribes need N unsubscribes to remove entry', () => {
    const e = new TopicEmitter<string, void>();
    const cb = vi.fn();
    const off1 = e.subscribe('t1', 's1', cb);
    const off2 = e.subscribe('t1', 's1', cb);
    expect(e.hasSubscribers('t1')).toBe(true);
    off1();
    expect(e.hasSubscribers('t1')).toBe(true); // still has refcount=1
    e.publish('t1', undefined);
    expect(cb).toHaveBeenCalledTimes(1); // still delivers
    off2();
    expect(e.hasSubscribers('t1')).toBe(false); // gone
    e.publish('t1', undefined);
    expect(cb).toHaveBeenCalledTimes(1); // no further
  });

  it('unsubscribe is idempotent (second call no-op)', () => {
    const e = new TopicEmitter<string, void>();
    const cb = vi.fn();
    const off = e.subscribe('t1', 's1', cb);
    off();
    off(); // must not throw
    e.publish('t1', undefined);
    expect(cb).not.toHaveBeenCalled();
  });

  it('hasSubscribers reflects current state', () => {
    const e = new TopicEmitter<string, void>();
    expect(e.hasSubscribers('t1')).toBe(false);
    const off = e.subscribe('t1', 's1', () => {});
    expect(e.hasSubscribers('t1')).toBe(true);
    off();
    expect(e.hasSubscribers('t1')).toBe(false);
  });

  it('one subscriber throwing does not block others', () => {
    const e = new TopicEmitter<string, void>();
    const a = vi.fn(() => {
      throw new Error('boom');
    });
    const b = vi.fn();
    e.subscribe('t1', 'a', a);
    e.subscribe('t1', 'b', b);
    expect(() => e.publish('t1', undefined)).not.toThrow();
    expect(a).toHaveBeenCalled();
    expect(b).toHaveBeenCalled();
  });
});
