import { describe, expect, it, vi } from 'vitest';
import { CompositeStore } from '../composite-store.ts';

interface FakeStore {
  read(): Promise<string>;
  write(value: string): Promise<void>;
  toggle(id: string): Promise<boolean>;
}

class TestCompositeStore extends CompositeStore<FakeStore> {
  read() {
    return this.primary.read();
  }

  write(value: string) {
    return this.fanOut('write', (s) => s.write(value));
  }

  writeToSubset(value: string, stores: FakeStore[]) {
    return this.fanOut('write-subset', (s) => s.write(value), stores);
  }

  toggle(id: string) {
    return this.fanOutCollect(
      'toggle',
      (s) => s.toggle(id),
      (results) => results.some((r) => r),
    );
  }
}

function fakeStore(readValue: string): FakeStore {
  return {
    read: vi.fn().mockResolvedValue(readValue),
    write: vi.fn().mockResolvedValue(undefined),
    toggle: vi.fn().mockResolvedValue(true),
  };
}

describe('CompositeStore', () => {
  it('read delegates to first store only', async () => {
    const s1 = fakeStore('primary');
    const s2 = fakeStore('secondary');
    const composite = new TestCompositeStore([s1, s2]);

    expect(await composite.read()).toBe('primary');
    expect(s1.read).toHaveBeenCalledOnce();
    expect(s2.read).not.toHaveBeenCalled();
  });

  it('write fans out to all stores', async () => {
    const s1 = fakeStore('a');
    const s2 = fakeStore('b');
    const composite = new TestCompositeStore([s1, s2]);

    await composite.write('hello');
    expect(s1.write).toHaveBeenCalledWith('hello');
    expect(s2.write).toHaveBeenCalledWith('hello');
  });

  it('partial write failure logs but does not throw', async () => {
    const s1 = fakeStore('a');
    const s2 = fakeStore('b');
    (s2.write as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('boom'));
    const composite = new TestCompositeStore([s1, s2]);

    await expect(composite.write('hello')).resolves.toBeUndefined();
  });

  it('all writes failing throws AggregateError', async () => {
    const s1 = fakeStore('a');
    const s2 = fakeStore('b');
    (s1.write as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail1'));
    (s2.write as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail2'));
    const composite = new TestCompositeStore([s1, s2]);

    await expect(composite.write('hello')).rejects.toThrow('All stores failed');
  });

  it('fanOutCollect returns aggregated result from all stores', async () => {
    const s1 = fakeStore('a');
    const s2 = fakeStore('b');
    (s1.toggle as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    (s2.toggle as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    const composite = new TestCompositeStore([s1, s2]);

    expect(await composite.toggle('x')).toBe(true);
  });

  it('fanOutCollect with partial failure still collects successful results', async () => {
    const s1 = fakeStore('a');
    const s2 = fakeStore('b');
    (s1.toggle as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (s2.toggle as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('boom'));
    const composite = new TestCompositeStore([s1, s2]);

    expect(await composite.toggle('x')).toBe(true);
  });

  it('fanOutCollect throws when all stores fail', async () => {
    const s1 = fakeStore('a');
    const s2 = fakeStore('b');
    (s1.toggle as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail1'));
    (s2.toggle as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail2'));
    const composite = new TestCompositeStore([s1, s2]);

    await expect(composite.toggle('x')).rejects.toThrow('All stores failed');
  });

  it('fanOut with custom stores subset skips unlisted stores', async () => {
    const s1 = fakeStore('a');
    const s2 = fakeStore('b');
    const s3 = fakeStore('c');
    const composite = new TestCompositeStore([s1, s2, s3]);

    await composite.writeToSubset('hello', [s2, s3]);
    expect(s1.write).not.toHaveBeenCalled();
    expect(s2.write).toHaveBeenCalledWith('hello');
    expect(s3.write).toHaveBeenCalledWith('hello');
  });
});
