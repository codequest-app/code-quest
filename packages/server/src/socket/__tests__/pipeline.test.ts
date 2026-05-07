import { Pipeline, type PipelineContext } from '@code-quest/shared';
import { describe, expect, it } from 'vitest';

describe('Pipeline', () => {
  it('runs middleware in order (onion: before → core → after)', async () => {
    const order: string[] = [];

    const pipeline = new Pipeline([
      async (_ctx, next) => {
        order.push('a:before');
        await next();
        order.push('a:after');
      },
      async (_ctx, next) => {
        order.push('b:before');
        await next();
        order.push('b:after');
      },
    ]);

    await pipeline.run({}, async () => {
      order.push('core');
    });

    expect(order).toEqual(['a:before', 'b:before', 'core', 'b:after', 'a:after']);
  });

  it('not calling next() skips core and remaining middleware', async () => {
    const order: string[] = [];

    const pipeline = new Pipeline([
      async (_ctx) => {
        order.push('reject');
        // don't call next
      },
      async (_ctx, next) => {
        order.push('should not run');
        await next();
      },
    ]);

    await pipeline.run({}, async () => {
      order.push('core should not run');
    });

    expect(order).toEqual(['reject']);
  });

  it('context is shared across all middleware and core', async () => {
    const pipeline = new Pipeline([
      async (ctx, next) => {
        ctx.token = 'abc';
        await next();
      },
      async (ctx, next) => {
        ctx.validated = ctx.token === 'abc';
        await next();
      },
    ]);

    const ctx: PipelineContext = {};
    await pipeline.run(ctx, async () => {
      ctx.coreRan = true;
    });

    expect(ctx).toMatchObject({ token: 'abc', validated: true, coreRan: true });
  });

  it('core can set context values visible to after-phase', async () => {
    let afterValue: unknown;

    const pipeline = new Pipeline([
      async (ctx, next) => {
        await next();
        afterValue = ctx.socket;
      },
    ]);

    const ctx: PipelineContext = {};
    await pipeline.run(ctx, async () => {
      ctx.socket = 'live-socket';
    });

    expect(afterValue).toBe('live-socket');
  });

  it('empty middleware runs core directly', async () => {
    const pipeline = new Pipeline([]);
    let coreRan = false;

    await pipeline.run({}, async () => {
      coreRan = true;
    });

    expect(coreRan).toBe(true);
  });

  it('sync middleware works', async () => {
    const order: string[] = [];

    const pipeline = new Pipeline([
      (_ctx, next) => {
        order.push('sync-before');
        next().then(() => order.push('sync-after'));
      },
    ]);

    await pipeline.run({}, async () => {
      order.push('core');
    });

    expect(order).toEqual(['sync-before', 'core', 'sync-after']);
  });

  it('ctx.terminate() resolves when onTerminate is called', async () => {
    const order: string[] = [];
    let triggerTerminate!: () => void;

    const pipeline = new Pipeline([
      async (ctx, next) => {
        order.push('before');
        await next();
        order.push('connected');
        await ctx.terminate!();
        order.push('terminated');
      },
    ]);

    const done = pipeline.run(
      {},
      async () => {
        order.push('core');
      },
      () =>
        new Promise<void>((resolve) => {
          triggerTerminate = resolve;
        }),
    );

    await new Promise<void>((r) => setTimeout(r, 10));
    expect(order).toEqual(['before', 'core', 'connected']);

    triggerTerminate();
    await done;

    expect(order).toEqual(['before', 'core', 'connected', 'terminated']);
  });

  it('ctx.terminate() resolves immediately if no terminateFactory provided', async () => {
    const order: string[] = [];

    const pipeline = new Pipeline([
      async (ctx, next) => {
        await next();
        await ctx.terminate!();
        order.push('done');
      },
    ]);

    await pipeline.run({}, async () => {});

    expect(order).toEqual(['done']);
  });

  it('reconnect pattern: next() can be called multiple times in a loop', async () => {
    let connectCount = 0;
    let terminateCount = 0;
    const terminators: Array<() => void> = [];

    const pipeline = new Pipeline([
      async (ctx, next) => {
        while (connectCount < 3) {
          await next();
          connectCount++;
          await ctx.terminate!();
          terminateCount++;
        }
      },
    ]);

    const done = pipeline.run(
      {},
      async () => {},
      () =>
        new Promise<void>((resolve) => {
          terminators.push(resolve);
        }),
    );

    for (let i = 0; i < 3; i++) {
      await new Promise<void>((r) => setTimeout(r, 5));
      terminators[i]!();
    }

    await done;
    expect(connectCount).toBe(3);
    expect(terminateCount).toBe(3);
  });
});
