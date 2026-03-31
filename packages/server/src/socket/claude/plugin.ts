import {
  addMarketplaceSchema,
  availablePluginSchema,
  type MarketplaceSourceConfig,
  pluginInfoSchema,
  pluginInstallSchema,
  pluginToggleSchema,
  pluginUninstallSchema,
  refreshMarketplaceSchema,
  removeMarketplaceSchema,
} from '@code-quest/shared';
import type { HandlerContext } from '../context.ts';
import type { TypedSocket } from '../types.ts';
import { errMsg } from '../types.ts';
import { runPluginCommand, runPluginCommandAsync } from './cli.ts';

function buildMarketplaceSource(k: {
  source: string;
  repo?: string;
  url?: string;
  path?: string;
  package?: string;
}): MarketplaceSourceConfig {
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

export function register(socket: TypedSocket, ctx: HandlerContext): void {
  socket.on('plugin:list', async (payload, callback) => {
    const cwd = process.cwd();
    const includeAvailable = payload?.includeAvailable ?? false;
    const cached = ctx.pluginCache.get(cwd);
    if (cached && Date.now() - cached.ts < ctx.PLUGIN_CACHE_TTL) {
      if (!includeAvailable || cached.available.length > 0) {
        callback({ installed: cached.installed, available: cached.available });
        return;
      }
    }

    const installedResult = runPluginCommand(['list', '--json']);
    let installed: unknown[] = [];
    if (installedResult.ok) {
      try {
        installed = JSON.parse(installedResult.stdout);
        if (!Array.isArray(installed)) installed = [];
      } catch {
        installed = [];
      }
    }

    let available: unknown[] = [];
    if (payload?.includeAvailable) {
      const availableResult = await runPluginCommandAsync(['list', '--json', '--available']);
      if (availableResult.ok) {
        try {
          const data = JSON.parse(availableResult.stdout);
          if (data && typeof data === 'object' && !Array.isArray(data)) {
            if (Array.isArray(data.installed)) installed = data.installed;
            if (Array.isArray(data.available)) available = data.available;
          }
        } catch {
          // fall back to installed-only
        }
      }
    }

    const validInstalled = pluginInfoSchema.array().parse(installed);
    const validAvailable = availablePluginSchema.array().parse(available);

    const existing = ctx.pluginCache.get(cwd);
    ctx.pluginCache.set(cwd, {
      installed: validInstalled,
      available: validAvailable,
      marketplaces: existing?.marketplaces ?? [],
      ts: Date.now(),
    });
    callback({ installed: validInstalled, available: validAvailable });
  });

  socket.on('plugin:install', (payload, callback) => {
    try {
      const { pluginId } = pluginInstallSchema.parse(payload);
      const result = runPluginCommand(['install', pluginId]);
      if (!result.ok) {
        callback({ success: false, error: result.stderr || 'Failed to install plugin' });
        return;
      }
      ctx.pluginCache.delete(process.cwd());
      callback({ success: true, needsRestart: true });
    } catch (err) {
      callback({
        success: false,
        error: errMsg(err, 'Invalid payload'),
      });
    }
  });

  socket.on('plugin:uninstall', (payload, callback) => {
    try {
      const { pluginId } = pluginUninstallSchema.parse(payload);
      const result = runPluginCommand(['uninstall', pluginId]);
      if (!result.ok) {
        callback({ success: false, error: result.stderr || 'Failed to uninstall plugin' });
        return;
      }
      ctx.pluginCache.delete(process.cwd());
      callback({ success: true, needsRestart: true });
    } catch (err) {
      callback({
        success: false,
        error: errMsg(err, 'Invalid payload'),
      });
    }
  });

  socket.on('plugin:toggle', (payload, callback) => {
    try {
      const { pluginId, enabled } = pluginToggleSchema.parse(payload);
      const result = runPluginCommand([enabled ? 'enable' : 'disable', pluginId]);
      if (!result.ok) {
        callback({ success: false, error: result.stderr || 'Failed to toggle plugin' });
        return;
      }
      ctx.pluginCache.delete(process.cwd());
      callback({ success: true, needsRestart: true });
    } catch (err) {
      callback({
        success: false,
        error: errMsg(err, 'Invalid payload'),
      });
    }
  });

  socket.on('plugin:list_marketplaces', (callback) => {
    const cwd = process.cwd();
    const cached = ctx.pluginCache.get(cwd);
    if (cached && Date.now() - cached.ts < ctx.PLUGIN_CACHE_TTL && cached.marketplaces.length > 0) {
      callback({ marketplaces: cached.marketplaces });
      return;
    }

    const result = runPluginCommand(['marketplace', 'list', '--json']);
    if (!result.ok) {
      callback({ marketplaces: [] });
      return;
    }
    try {
      const raw: Array<{
        name: string;
        source: string;
        repo?: string;
        url?: string;
        path?: string;
        package?: string;
        installLocation?: string;
      }> = JSON.parse(result.stdout);
      const marketplaces = (Array.isArray(raw) ? raw : []).map((k) => ({
        name: k.name,
        config: {
          source: buildMarketplaceSource(k),
          installLocation: k.installLocation ?? '',
        },
        pluginCount: 0,
        installedCount: 0,
      }));
      const existing = ctx.pluginCache.get(cwd);
      ctx.pluginCache.set(cwd, {
        installed: existing?.installed ?? [],
        available: existing?.available ?? [],
        marketplaces,
        ts: existing?.ts ?? Date.now(),
      });
      callback({ marketplaces });
    } catch {
      callback({ marketplaces: [] });
    }
  });

  socket.on('plugin:add_marketplace', (payload, callback) => {
    try {
      const { source } = addMarketplaceSchema.parse(payload);
      const result = runPluginCommand(['marketplace', 'add', source]);
      if (!result.ok) {
        callback({ success: false, error: result.stderr || 'Failed to add marketplace' });
        return;
      }
      ctx.pluginCache.delete(process.cwd());
      callback({ success: true });
    } catch (err) {
      callback({
        success: false,
        error: errMsg(err, 'Invalid payload'),
      });
    }
  });

  socket.on('plugin:remove_marketplace', (payload, callback) => {
    try {
      const { marketplaceId } = removeMarketplaceSchema.parse(payload);
      const result = runPluginCommand(['marketplace', 'remove', marketplaceId]);
      if (!result.ok) {
        callback({ success: false, error: result.stderr || 'Failed to remove marketplace' });
        return;
      }
      ctx.pluginCache.delete(process.cwd());
      callback({ success: true });
    } catch (err) {
      callback({
        success: false,
        error: errMsg(err, 'Invalid payload'),
      });
    }
  });

  socket.on('plugin:refresh_marketplace', (payload, callback) => {
    try {
      const { marketplaceId } = refreshMarketplaceSchema.parse(payload);
      const result = runPluginCommand(['marketplace', 'update', marketplaceId]);
      if (!result.ok) {
        callback({ success: false, error: result.stderr || 'Failed to refresh marketplace' });
        return;
      }
      ctx.pluginCache.delete(process.cwd());
      callback({ success: true });
    } catch (err) {
      callback({
        success: false,
        error: errMsg(err, 'Invalid payload'),
      });
    }
  });
}
