import type { AvailablePlugin, MarketplaceInfo, PluginInfo } from '@code-quest/shared';
import { useState } from 'react';
import { IconButton, TrashIcon } from './ui/Icons';
import { ToggleSwitch } from './ui/ToggleSwitch';

function pluginDisplayName(id: string): string {
  return id.split('@')[0] ?? id;
}

function formatInstallCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k installs`;
  return `${n} installs`;
}

function StatusDot({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full flex-shrink-0 mr-2 ${enabled ? 'bg-success' : 'bg-text/30'}`}
    />
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[0.75em] font-semibold uppercase tracking-[0.05em] text-text-muted border-b border-border mt-3 mb-2 pb-1 first:mt-0">
      {children}
    </div>
  );
}

export interface InstalledPluginListProps {
  installed: PluginInfo[];
  available: AvailablePlugin[];
  marketplaces: MarketplaceInfo[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onToggle: (pluginId: string, enabled: boolean) => void;
  onUninstall: (pluginId: string) => void;
  onInstall: (pluginId: string, scope: 'user' | 'project' | 'local') => void;
  installing: string | null;
}

export function InstalledPluginList({
  installed,
  available,
  marketplaces,
  searchQuery,
  onSearchChange,
  onToggle,
  onUninstall,
  onInstall,
  installing,
}: InstalledPluginListProps) {
  const [selectedForInstall, setSelectedForInstall] = useState<string | null>(null);

  const installedIds = new Set(installed.map((p) => p.id));
  const filteredInstalled = installed.filter(
    (p) =>
      !searchQuery || pluginDisplayName(p.id).toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredAvailable = available.filter(
    (p) =>
      !installedIds.has(p.pluginId) &&
      (!searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <>
      <div className="mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search plugins…"
          className="w-full border border-border bg-input text-text placeholder:text-text-muted rounded-md px-3 py-2 text-[0.9em] outline-none focus:border-accent"
        />
      </div>

      {filteredInstalled.length > 0 && (
        <>
          <SectionHeader>Installed</SectionHeader>
          <ul className="list-none m-0 p-0">
            {filteredInstalled.map((plugin) => (
              <li
                key={plugin.id}
                className="flex items-center justify-between bg-surface border border-border rounded-md mb-2 p-3"
              >
                <div className="flex items-center min-w-0 flex-1">
                  <StatusDot enabled={plugin.enabled} />
                  <span className="text-text font-medium text-[0.9em] truncate">
                    {pluginDisplayName(plugin.id)}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <ToggleSwitch
                    isOn={plugin.enabled}
                    onClick={() => onToggle(plugin.id, plugin.enabled)}
                  />
                  <IconButton
                    onClick={() => onUninstall(plugin.id)}
                    label="Uninstall plugin"
                    danger
                  >
                    <TrashIcon />
                  </IconButton>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {filteredAvailable.length > 0 && (
        <>
          <SectionHeader>Available</SectionHeader>
          <ul className="list-none m-0 p-0">
            {filteredAvailable.map((plugin) => {
              const marketplace = marketplaces.find((m) => m.name === plugin.marketplaceName);
              const isOfficial =
                marketplace?.config.source.source === 'github' &&
                marketplace.config.source.repo === 'anthropics/claude-plugins-official';
              const isSelected = selectedForInstall === plugin.pluginId;
              const isInstalling = installing === plugin.pluginId;
              return (
                <li
                  key={plugin.pluginId}
                  className="bg-surface border border-border rounded-md mb-2 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-text font-medium text-[0.9em]">{plugin.name}</span>
                        {plugin.installCount != null && plugin.installCount > 0 && (
                          <span className="text-text-muted text-[0.75em]">
                            {formatInstallCount(plugin.installCount)}
                          </span>
                        )}
                      </div>
                      {plugin.description && (
                        <p className="text-text-muted text-[0.85em] m-0 mb-1">
                          {plugin.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 text-[0.75em] text-text-muted">
                        <span>from {plugin.marketplaceName}</span>
                        {isOfficial && (
                          <span title="Official Claude Code marketplace" className="text-button">
                            ✓
                          </span>
                        )}
                      </div>
                    </div>
                    {!isSelected && (
                      <button
                        type="button"
                        disabled={isInstalling}
                        onClick={() => setSelectedForInstall(plugin.pluginId)}
                        className="flex-shrink-0 px-2.5 py-1 rounded bg-button text-white text-[0.85em] border-0 disabled:opacity-50"
                      >
                        {isInstalling ? 'Installing…' : 'Install'}
                      </button>
                    )}
                  </div>

                  {isSelected && (
                    <div className="mt-2 border-t border-border pt-2">
                      <p className="text-[0.78em] text-text-muted mb-2">
                        Make sure you trust a plugin before installing. Anthropic does not control
                        what MCP servers, files, or other software are included in plugins.
                      </p>
                      {(
                        [
                          {
                            scope: 'user' as const,
                            label: 'Install for you',
                            desc: 'Available in all your projects',
                          },
                          {
                            scope: 'project' as const,
                            label: 'Install for this project',
                            desc: 'Shared with all collaborators',
                          },
                          {
                            scope: 'local' as const,
                            label: 'Install locally',
                            desc: 'Only for you, only in this repo',
                          },
                        ] as const
                      ).map(({ scope, label, desc }) => (
                        <button
                          key={scope}
                          type="button"
                          onClick={() => {
                            setSelectedForInstall(null);
                            onInstall(plugin.pluginId, scope);
                          }}
                          className="w-full text-left px-2.5 py-2 rounded border border-border mb-1 hover:bg-bg transition-colors"
                        >
                          <div className="text-[0.875em] font-medium text-text">{label}</div>
                          <div className="text-[0.78em] text-text-muted">{desc}</div>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setSelectedForInstall(null)}
                        className="text-[0.8em] text-text-muted hover:text-text mt-1"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {filteredInstalled.length === 0 && filteredAvailable.length === 0 && (
        <p className="text-center text-text/50 py-8 text-[0.9em]">No plugins found.</p>
      )}
    </>
  );
}
