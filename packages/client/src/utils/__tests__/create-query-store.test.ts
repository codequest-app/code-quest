import { describe, expect, it, vi } from 'vitest';
import { createQueryStore } from '../create-query-store';

function createStore() {
  const fetchFn = vi.fn<(cwd: string) => Promise<string>>();
  const store = createQueryStore<string>({ fetch: fetchFn, idPrefix: 'test' });
  return { store, fetchFn };
}

describe('createQueryStore', () => {
  it('get returns undefined before any fetch', () => {
    const { store } = createStore();
    expect(store.get('/a')).toBeUndefined();
  });

  it('subscribe triggers initial fetch and notifies on completion', async () => {
    const { store, fetchFn } = createStore();
    fetchFn.mockResolvedValue('result-a');

    const onChange = vi.fn();
    store.subscribe('/a', onChange);

    await vi.waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(store.get('/a')).toBe('result-a');
  });

  it('subscribe deduplicates inflight fetches for the same cwd', async () => {
    const { store, fetchFn } = createStore();
    fetchFn.mockResolvedValue('result-a');

    const onChange1 = vi.fn();
    const onChange2 = vi.fn();
    store.subscribe('/a', onChange1);
    store.subscribe('/a', onChange2);

    await vi.waitFor(() => expect(onChange1).toHaveBeenCalled());
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(onChange2).toHaveBeenCalled();
  });

  it('refetch updates cache and notifies subscribers', async () => {
    const { store, fetchFn } = createStore();
    fetchFn.mockResolvedValue('v1');

    const onChange = vi.fn();
    store.subscribe('/a', onChange);
    await vi.waitFor(() => expect(store.get('/a')).toBe('v1'));

    fetchFn.mockResolvedValue('v2');
    await store.refetch('/a');

    expect(store.get('/a')).toBe('v2');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('refetchIfSubscribed skips when no subscribers', async () => {
    const { store, fetchFn } = createStore();
    fetchFn.mockResolvedValue('v1');

    await store.refetchIfSubscribed('/a');
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('refetchIfSubscribed fetches when subscribers exist', async () => {
    const { store, fetchFn } = createStore();
    fetchFn.mockResolvedValue('v1');

    store.subscribe('/a', vi.fn());
    await vi.waitFor(() => expect(store.get('/a')).toBe('v1'));

    fetchFn.mockResolvedValue('v2');
    await store.refetchIfSubscribed('/a');
    expect(store.get('/a')).toBe('v2');
  });

  it('unsubscribe removes listener', async () => {
    const { store, fetchFn } = createStore();
    fetchFn.mockResolvedValue('v1');

    const onChange = vi.fn();
    const unsub = store.subscribe('/a', onChange);
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));

    unsub();
    fetchFn.mockResolvedValue('v2');
    await store.refetch('/a');

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('hasSubscribers returns correct state', async () => {
    const { store, fetchFn } = createStore();
    fetchFn.mockResolvedValue('v1');

    expect(store.hasSubscribers('/a')).toBe(false);

    const unsub = store.subscribe('/a', vi.fn());
    expect(store.hasSubscribers('/a')).toBe(true);

    unsub();
    expect(store.hasSubscribers('/a')).toBe(false);
  });
});
