import { describe, expect, it, vi } from 'vitest';
import { ResumableSocket } from '../resumable-socket.ts';
import type { TypedSocket } from '../types.ts';

/**
 * ResumableSocket wraps any TypedSocket and adds:
 *   - monotonic outbound seq counter
 *   - bounded ring buffer of recent outbound events
 *   - resume(lastSeq) replays buffered events with seq > lastSeq
 *
 * Transport-agnostic: the inner socket can be any TypedSocket
 * (socket.io adapter, WsSocketAdapter, future).
 */
describe('ResumableSocket', () => {
  function makeInner(id = 's-1') {
    const emit = vi.fn();
    const inner: TypedSocket = { id, emit, on: vi.fn() };
    return { inner, emit };
  }

  describe('emit & seq', () => {
    it('forwards emit to inner socket and stores in buffer', () => {
      const { inner, emit } = makeInner();
      const wrapped = new ResumableSocket(inner);

      wrapped.emit('e', { x: 1 });
      wrapped.emit('e', { x: 2 });

      expect(emit).toHaveBeenCalledTimes(2);
      expect(emit).toHaveBeenNthCalledWith(1, 'e', { x: 1 });
      expect(emit).toHaveBeenNthCalledWith(2, 'e', { x: 2 });
    });

    it('id passes through from inner socket', () => {
      const { inner } = makeInner('abc');
      const wrapped = new ResumableSocket(inner);

      expect(wrapped.id).toBe('abc');
    });

    it('on registration delegates to inner socket', () => {
      const { inner } = makeInner();
      const wrapped = new ResumableSocket(inner);
      const fn = vi.fn();

      wrapped.on('disconnect', fn);

      expect(inner.on).toHaveBeenCalledWith('disconnect', fn);
    });
  });

  describe('ring buffer', () => {
    it('caps at the configured size, dropping oldest entries', () => {
      const { inner } = makeInner();
      const wrapped = new ResumableSocket(inner, { bufferSize: 3 });

      for (let n = 1; n <= 5; n++) wrapped.emit('e', { n });

      const ids = wrapped.bufferSeqs();
      expect(ids).toEqual([3, 4, 5]);
    });

    it('default buffer size is 500', () => {
      const { inner } = makeInner();
      const wrapped = new ResumableSocket(inner);
      for (let n = 1; n <= 600; n++) wrapped.emit('e', { n });
      expect(wrapped.bufferSeqs()).toHaveLength(500);
      expect(wrapped.bufferSeqs()[0]).toBe(101);
      expect(wrapped.bufferSeqs().at(-1)).toBe(600);
    });
  });

  describe('resume', () => {
    it('replays events with seq > lastSeq via the inner socket', () => {
      const { inner, emit } = makeInner();
      const wrapped = new ResumableSocket(inner);

      wrapped.emit('e', { n: 1 }); // seq=1
      wrapped.emit('e', { n: 2 }); // seq=2
      wrapped.emit('e', { n: 3 }); // seq=3
      emit.mockClear();

      wrapped.resume(1);

      expect(emit).toHaveBeenCalledTimes(2);
      expect(emit).toHaveBeenNthCalledWith(1, 'e', { n: 2 });
      expect(emit).toHaveBeenNthCalledWith(2, 'e', { n: 3 });
    });

    it('resume(0) replays everything in buffer', () => {
      const { inner, emit } = makeInner();
      const wrapped = new ResumableSocket(inner);
      wrapped.emit('e', { n: 1 });
      wrapped.emit('e', { n: 2 });
      emit.mockClear();

      wrapped.resume(0);

      expect(emit).toHaveBeenCalledTimes(2);
    });

    it('resume(lastSeq) at or beyond newest replays nothing', () => {
      const { inner, emit } = makeInner();
      const wrapped = new ResumableSocket(inner);
      wrapped.emit('e', { n: 1 });
      wrapped.emit('e', { n: 2 });
      emit.mockClear();

      wrapped.resume(2);
      wrapped.resume(99);

      expect(emit).not.toHaveBeenCalled();
    });

    it('returns "gap" status when lastSeq is older than what buffer retains', () => {
      const { inner } = makeInner();
      const wrapped = new ResumableSocket(inner, { bufferSize: 2 });
      wrapped.emit('e', { n: 1 }); // dropped
      wrapped.emit('e', { n: 2 });
      wrapped.emit('e', { n: 3 });

      // client was last at seq=0; buffer only retains 2..3 → gap
      const result = wrapped.resume(0);

      expect(result).toEqual({ kind: 'gap' });
    });

    it('returns "ok" status when resume is satisfiable', () => {
      const { inner } = makeInner();
      const wrapped = new ResumableSocket(inner);
      wrapped.emit('e', { n: 1 });
      wrapped.emit('e', { n: 2 });

      const result = wrapped.resume(1);

      expect(result).toEqual({ kind: 'ok', replayed: 1 });
    });
  });

  describe('rebind', () => {
    it('rebind swaps the inner socket; subsequent emits go to the new one', () => {
      const a = makeInner('a');
      const b = makeInner('b');
      const wrapped = new ResumableSocket(a.inner);

      wrapped.emit('e', { from: 'a' });
      wrapped.rebind(b.inner);
      wrapped.emit('e', { from: 'b' });

      expect(a.emit).toHaveBeenCalledTimes(1);
      expect(b.emit).toHaveBeenCalledTimes(1);
      expect(b.emit).toHaveBeenCalledWith('e', { from: 'b' });
    });

    it('seq counter persists across rebind (so client lastSeq stays valid)', () => {
      const a = makeInner('a');
      const b = makeInner('b');
      const wrapped = new ResumableSocket(a.inner);
      wrapped.emit('e', { n: 1 });
      wrapped.emit('e', { n: 2 });

      wrapped.rebind(b.inner);
      wrapped.emit('e', { n: 3 });

      // After rebind, resume(2) on the rebound socket should replay only seq=3.
      b.emit.mockClear();
      const result = wrapped.resume(2);

      expect(result).toEqual({ kind: 'ok', replayed: 1 });
      expect(b.emit).toHaveBeenCalledTimes(1);
      expect(b.emit).toHaveBeenCalledWith('e', { n: 3 });
    });
  });
});
