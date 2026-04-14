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
import type { HandlerContext } from '../../types.ts';
import type { Channel } from '../channel.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';
import { errMsg } from '../utils/helpers.ts';
import { runPluginCommand, runPluginCommandAsync } from './cli.ts';
import { claudeState, clearPluginCache, updatePluginCache } from './state.ts';

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

interface PluginCommandAction<T> {
  schema: z.ZodType<T>;
  toArgs: (parsed: T) => string[];
  errorLabel: string;
  successExtra?: Record<string, unknown>;
}

function createPluginCommandHandler<T>(action: PluginCommandAction<T>) {
  return (
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): void => {
    try {
      const parsed = action.schema.parse(payload);
      const result = runPluginCommand(action.toArgs(parsed));
      if (!result.ok) {
        callback?.({ success: false, error: result.stderr || action.errorLabel });
        return;
      }
      clearPluginCache();
      callback?.({ success: true, ...action.successExtra });
    } catch (err) {
      callback?.({ success: false, error: errMsg(err, 'Invalid payload') });
    }
  };
}

// Plugin list JSON is CLI-private (shape is an opaque array); keep these
// schemas local rather than leak them into @code-quest/shared.
const pluginListArraySchema = z.array(z.unknown());
const availablePluginListSchema = z.object({
  installed: z.array(z.unknown()).default([]),
  available: z.array(z.unknown()).default([]),
});

function parsePluginJson(stdout: string, label: string): unknown[] {
  try {
    const parsed = pluginListArraySchema.safeParse(JSON.parse(stdout));
    return parsed.success ? parsed.data : [];
  } catch (err) {
    logger.warn({ err }, `Failed to parse ${label} plugins JSON`);
    return [];
  }
}

function parseAvailablePluginJson(stdout: string): {
  installed: unknown[];
  available: unknown[];
} {
  try {
    const parsed = availablePluginListSchema.safeParse(JSON.parse(stdout));
    if (parsed.success) return parsed.data;
  } catch (err) {
    logger.warn({ err }, 'Failed to parse available plugins JSON');
  }
  return { installed: [], available: [] };
}

export function create({ emitter }: Pick<HandlerContext, 'emitter'>): void {
  async function handleList(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    const { includeAvailable = false } = listPluginsPayloadSchema.parse(payload ?? {});
    const cached = claudeState.pluginCache;
    if (cached && Date.now() - cached.ts < claudeState.PLUGIN_CACHE_TTL) {
      if (!includeAvailable || cached.available.length > 0) {
        callback?.({ installed: cached.installed, available: cached.available });
        return;
      }
    }

    const installedResult = runPluginCommand(['list', '--json']);
    let installed: unknown[] = installedResult.ok
      ? parsePluginJson(installedResult.stdout, 'installed')
      : [];

    let available: unknown[] = [];
    if (includeAvailable) {
      const availableResult = await runPluginCommandAsync(['list', '--json', '--available']);
      if (availableResult.ok) {
        const parsed = parseAvailablePluginJson(availableResult.stdout);
        if (parsed.installed.length) installed = parsed.installed;
        if (parsed.available.length) available = parsed.available;
      }
    }

    const validInstalled = pluginInfoSchema.array().parse(installed);
    const validAvailable = availablePluginSchema.array().parse(available);

    updatePluginCache({
      installed: validInstalled,
      available: validAvailable,
      ts: Date.now(),
    });
    callback?.({ installed: validInstalled, available: validAvailable });
  }

  function parseMarketplacesAndUpdateCache(stdout: string) {
    const parsed = JSON.parse(stdout);
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
    updatePluginCache({ marketplaces });
    return marketplaces;
  }

  function handleListMarketplaces(
    _ch: Channel | null,
    _payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): void {
    const cached = claudeState.pluginCache;
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
      const marketplaces = parseMarketplacesAndUpdateCache(result.stdout);
      callback?.({ marketplaces });
    } catch (err) {
      logger.warn({ err }, 'Failed to list marketplaces');
      callback?.({ marketplaces: [] });
    }
  }

  emitter.on('plugin:list', handleList);
  emitter.on(
    'plugin:install',
    createPluginCommandHandler({
      schema: pluginInstallPayloadSchema,
      toArgs: ({ pluginId }) => ['install', pluginId],
      errorLabel: 'Failed to install plugin',
      successExtra: { needsRestart: true },
    }),
  );
  emitter.on(
    'plugin:uninstall',
    createPluginCommandHandler({
      schema: pluginUninstallPayloadSchema,
      toArgs: ({ pluginId }) => ['uninstall', pluginId],
      errorLabel: 'Failed to uninstall plugin',
      successExtra: { needsRestart: true },
    }),
  );
  emitter.on(
    'plugin:toggle',
    createPluginCommandHandler({
      schema: pluginTogglePayloadSchema,
      toArgs: ({ pluginId, enabled }) => [enabled ? 'enable' : 'disable', pluginId],
      errorLabel: 'Failed to toggle plugin',
      successExtra: { needsRestart: true },
    }),
  );
  emitter.on('plugin:list_marketplaces', handleListMarketplaces);
  emitter.on(
    'plugin:add_marketplace',
    createPluginCommandHandler({
      schema: addMarketplacePayloadSchema,
      toArgs: ({ source }) => ['marketplace', 'add', source],
      errorLabel: 'Failed to add marketplace',
    }),
  );
  emitter.on(
    'plugin:remove_marketplace',
    createPluginCommandHandler({
      schema: removeMarketplacePayloadSchema,
      toArgs: ({ marketplaceId }) => ['marketplace', 'remove', marketplaceId],
      errorLabel: 'Failed to remove marketplace',
    }),
  );
  emitter.on(
    'plugin:refresh_marketplace',
    createPluginCommandHandler({
      schema: refreshMarketplacePayloadSchema,
      toArgs: ({ marketplaceId }) => ['marketplace', 'update', marketplaceId],
      errorLabel: 'Failed to refresh marketplace',
    }),
  );
}
