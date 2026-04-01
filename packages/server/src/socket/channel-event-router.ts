import type { ChannelActionFn, ChannelEventFn, ChannelExitFn } from './types.ts';

export class ChannelEventRouter {
  private eventMap = new Map<string, ChannelEventFn>();
  private actionHandlers: ChannelActionFn[] = [];
  private exitHandlers: ChannelExitFn[] = [];

  onEvent(name: string, handler: ChannelEventFn): void {
    this.eventMap.set(name, handler);
  }

  onAction(handler: ChannelActionFn): void {
    this.actionHandlers.push(handler);
  }

  onExit(handler: ChannelExitFn): void {
    this.exitHandlers.push(handler);
  }

  dispatchEvent(...args: Parameters<ChannelEventFn>): void {
    const [, , se] = args;
    this.eventMap.get(se.name)?.(...args);
  }

  dispatchAction(...args: Parameters<ChannelActionFn>): void {
    for (const h of this.actionHandlers) {
      if (h(...args)) break;
    }
  }

  dispatchExit(...args: Parameters<ChannelExitFn>): void {
    for (const h of this.exitHandlers) {
      h(...args);
    }
  }
}
