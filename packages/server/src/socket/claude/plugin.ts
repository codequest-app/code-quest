import {
  addMarketplacePayloadSchema,
  availablePluginSchema,
  listPluginsPayloadSchema,
  type MarketplaceRawItem,
  type MarketplaceSourceConfig,
  marketplaceRawItemSchema,
  pluginInfoSchema,
  pluginInstallPayloadSchema,
  pluginTogglePayloadSchema,
  pluginUninstallPayloadSchema,
  refreshMarketplacePayloadSchema,
  removeMarketplacePayloadSchema,
} from '@code-quest/shared';
import { z } from 'zod';

import { logger } from '../../logger.ts';
import type { Channel } from '../channel.ts';
import type { ChannelEmitter } from '../channel-emitter.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';
import { errMsg } from '../utils/helpers.ts';
import { runPluginCommand, runPluginCommandAsync } from './cli.ts';
import { claudeState } from './state.ts';

function buildMarketplaceSource(k: MarketplaceRawItem): MarketplaceSourceConfig {
  switch (k.source) {
    case 'github':
      return { source: 'github', repo: k.repo ?? '' };
    case 'git':
      return { source: 'git', url: k.url ?? '' };
    case 'url':
      return { source: 'url', url: k.url ?? '' };
    case 'directory':
      return { source: 'directory', path: k.path ?? '' };
    case 'file':
      return { source: 'file', path: k.path ?? '' };
    case 'npm':
      return { source: 'npm', package: k.package ?? '' };
    default:
      return { source: 'url', url: '' };
  }
}

export function create(emitter: ChannelEmitter): void {
  async function handleList(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    const cwd = process.cwd();
    const { includeAvailable = false } = listPluginsPayloadSchema.parse(payload ?? {});
    const cached = claudeState.pluginCache.get(cwd);
    if (cached && Date.now() - cached.ts < claudeState.PLUGIN_CACHE_TTL) {
      if (!includeAvailable || cached.available.length > 0) {
        callback?.({ installed: cached.installed, available: cached.available });
        return;
      }
    }

    const installedResult = runPluginCommand(['list', '--json']);
    let installed: unknown[] = [];
    if (installedResult.ok) {
      try {
        installed = JSON.parse(installedResult.stdout);
        if (!Array.isArray(installed)) installed = [];
      } catch (err) {
        logger.warn({ err }, 'Failed to parse installed plugins JSON');
        installed = [];
      }
    }

    let available: unknown[] = [];
    if (includeAvailable) {
      const availableResult = await runPluginCommandAsync(['list', '--json', '--available']);
      if (availableResult.ok) {
        try {
          const data = JSON.parse(availableResult.stdout);
          if (data && typeof data === 'object' && !Array.isArray(data)) {
            if (Array.isArray(data.installed)) installed = data.installed;
            if (Array.isArray(data.available)) available = data.available;
          }
        } catch (err) {
          logger.warn({ err }, 'Failed to parse available plugins JSON');
        }
      }
    }

    const validInstalled = pluginInfoSchema.array().parse(installed);
    const validAvailable = availablePluginSchema.array().parse(available);

    const existing = claudeState.pluginCache.get(cwd);
    claudeState.pluginCache.set(cwd, {
      installed: validInstalled,
      available: validAvailable,
      marketplaces: existing?.marketplaces ?? [],
      ts: Date.now(),
    });
    callback?.({ installed: validInstalled, available: validAvailable });
  }

  function handleInstall(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): void {
    try {
      const { pluginId } = pluginInstallPayloadSchema.parse(payload);
      const result = runPluginCommand(['install', pluginId]);
      if (!result.ok) {
        callback?.({ success: false, error: result.stderr || 'Failed to install plugin' });
        return;
      }
      claudeState.pluginCache.delete(process.cwd());
      callback?.({ success: true, needsRestart: true });
    } catch (err) {
      callback?.({
        success: false,
        error: errMsg(err, 'Invalid payload'),
      });
    }
  }

  function handleUninstall(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): void {
    try {
      const { pluginId } = pluginUninstallPayloadSchema.parse(payload);
      const result = runPluginCommand(['uninstall', pluginId]);
      if (!result.ok) {
        callback?.({ success: false, error: result.stderr || 'Failed to uninstall plugin' });
        return;
      }
      claudeState.pluginCache.delete(process.cwd());
      callback?.({ success: true, needsRestart: true });
    } catch (err) {
      callback?.({
        success: false,
        error: errMsg(err, 'Invalid payload'),
      });
    }
  }

  function handleToggle(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): void {
    try {
      const { pluginId, enabled } = pluginTogglePayloadSchema.parse(payload);
      const result = runPluginCommand([enabled ? 'enable' : 'disable', pluginId]);
      if (!result.ok) {
        callback?.({ success: false, error: result.stderr || 'Failed to toggle plugin' });
        return;
      }
      claudeState.pluginCache.delete(process.cwd());
      callback?.({ success: true, needsRestart: true });
    } catch (err) {
      callback?.({
        success: false,
        error: errMsg(err, 'Invalid payload'),
      });
    }
  }

  function handleListMarketplaces(
    _ch: Channel | null,
    _payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): void {
    const cwd = process.cwd();
    const cached = claudeState.pluginCache.get(cwd);
    if (
      cached &&
      Date.now() - cached.ts < claudeState.PLUGIN_CACHE_TTL &&
      cached.marketplaces.length > 0
    ) {
      callback?.({ marketplaces: cached.marketplaces });
      return;
    }

    const result = runPluginCommand(['marketplace', 'list', '--json']);
    if (!result.ok) {
      callback?.({ marketplaces: [] });
      return;
    }
    try {
      const parsed = JSON.parse(result.stdout);
      const raw = z.array(marketplaceRawItemSchema).safeParse(parsed);
      const marketplaces = (raw.success ? raw.data : []).map((k) => ({
        name: k.name,
        config: {
          source: buildMarketplaceSource(k),
          installLocation: k.installLocation ?? '',
        },
        pluginCount: 0,
        installedCount: 0,
      }));
      const existing = claudeState.pluginCache.get(cwd);
      claudeState.pluginCache.set(cwd, {
        installed: existing?.installed ?? [],
        available: existing?.available ?? [],
        marketplaces,
        ts: existing?.ts ?? Date.now(),
      });
      callback?.({ marketplaces });
    } catch (err) {
      logger.warn({ err }, 'Failed to list marketplaces');
      callback?.({ marketplaces: [] });
    }
  }

  function handleAddMarketplace(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): void {
    try {
      const { source } = addMarketplacePayloadSchema.parse(payload);
      const result = runPluginCommand(['marketplace', 'add', source]);
      if (!result.ok) {
        callback?.({ success: false, error: result.stderr || 'Failed to add marketplace' });
        return;
      }
      claudeState.pluginCache.delete(process.cwd());
      callback?.({ success: true });
    } catch (err) {
      callback?.({
        success: false,
        error: errMsg(err, 'Invalid payload'),
      });
    }
  }

  function handleRemoveMarketplace(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): void {
    try {
      const { marketplaceId } = removeMarketplacePayloadSchema.parse(payload);
      const result = runPluginCommand(['marketplace', 'remove', marketplaceId]);
      if (!result.ok) {
        callback?.({ success: false, error: result.stderr || 'Failed to remove marketplace' });
        return;
      }
      claudeState.pluginCache.delete(process.cwd());
      callback?.({ success: true });
    } catch (err) {
      callback?.({
        success: false,
        error: errMsg(err, 'Invalid payload'),
      });
    }
  }

  function handleRefreshMarketplace(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): void {
    try {
      const { marketplaceId } = refreshMarketplacePayloadSchema.parse(payload);
      const result = runPluginCommand(['marketplace', 'update', marketplaceId]);
      if (!result.ok) {
        callback?.({ success: false, error: result.stderr || 'Failed to refresh marketplace' });
        return;
      }
      claudeState.pluginCache.delete(process.cwd());
      callback?.({ success: true });
    } catch (err) {
      callback?.({
        success: false,
        error: errMsg(err, 'Invalid payload'),
      });
    }
  }

  emitter.on('plugin:list', handleList);
  emitter.on('plugin:install', handleInstall);
  emitter.on('plugin:uninstall', handleUninstall);
  emitter.on('plugin:toggle', handleToggle);
  emitter.on('plugin:list_marketplaces', handleListMarketplaces);
  emitter.on('plugin:add_marketplace', handleAddMarketplace);
  emitter.on('plugin:remove_marketplace', handleRemoveMarketplace);
  emitter.on('plugin:refresh_marketplace', handleRefreshMarketplace);
}
