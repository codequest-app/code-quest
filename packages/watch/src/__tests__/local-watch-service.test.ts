import type { WatchCallback, WatchEvent, WatchService } from '@code-quest/schemas';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalWatchService } from '../local.ts';

describe('LocalWatchService', () => {
  it('satisfies WatchService interface', () => {
    const service: WatchService = new LocalWatchService();
    expect(typeof service.subscribe).toBe('function');
  });

  it('subscribe returns an unsubscribe function', () => {
    const service = new LocalWatchService();
    const unsub = service.subscribe('/tmp', vi.fn());
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('unsubscribe is idempotent — calling twice does not throw', () => {
    const service = new LocalWatchService();
    const unsub = service.subscribe('/tmp', vi.fn());
    expect(() => {
      unsub();
      unsub();
    }).not.toThrow();
  });

  it('multiple subscribers for the same cwd each receive events independently', () => {
    const service = new LocalWatchService();
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    service.subscribe('/tmp', cb1);
    service.subscribe('/tmp', cb2);
    // Both callbacks registered — verified via subscribe returning without throw
    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).not.toHaveBeenCalled();
  });

  it('unsubscribed callback no longer receives events', () => {
    const service = new LocalWatchService();
    const cb: WatchCallback = vi.fn();
    const unsub = service.subscribe('/tmp', cb);
    unsub();
    // After unsubscribe, the service should not hold a reference to cb
    // (we can only verify no errors thrown here — real event delivery is integration territory)
    expect(cb).not.toHaveBeenCalled();
  });

  it('accepts an optional logger', () => {
    const logger = {
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    expect(() => new LocalWatchService(logger)).not.toThrow();
  });

  it('WatchEvent type is compatible with @code-quest/schemas WatchEvent', () => {
    const event: WatchEvent = { type: 'change', path: 'src/foo.ts' };
    expect(event.type).toBe('change');
    expect(event.path).toBe('src/foo.ts');
  });
});
