import { useEffect, useState } from 'react';
import { useChannelConfig } from '../contexts/channel';
import { usePlugins } from '../contexts/PluginContext';
import { cn } from '../utils/cn';
import { InstalledPluginList } from './InstalledPluginList';
import { MarketplaceSection } from './MarketplaceSection';
import { Dialog, DialogContent } from './ui/Dialog';

interface ManagePluginsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ManagePluginsDialog({ open, onClose }: ManagePluginsDialogProps) {
  const {
    installed,
    available,
    marketplaces,
    needsRestart,
    installing,
    refreshPlugins,
    refreshMarketplaces,
    install,
    uninstall,
    toggle,
    addMarketplace,
    removeMarketplace,
  } = usePlugins();
  const { providerConfig } = useChannelConfig();

  const [activeTab, setActiveTab] = useState<'plugins' | 'marketplaces'>('plugins');
  const [searchQuery, setSearchQuery] = useState('');
  const [newMarketplaceSource, setNewMarketplaceSource] = useState('');
  const [adding, setAdding] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refresh fns are stable RPC wrappers
  useEffect(() => {
    if (!open) return;
    refreshPlugins();
    refreshMarketplaces();
  }, [open]);

  const handleAddMarketplace = async () => {
    if (!newMarketplaceSource.trim()) return;
    setAdding(true);
    await addMarketplace(newMarketplaceSource.trim());
    setNewMarketplaceSource('');
    setAdding(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Manage Plugins" size="lg">
        {needsRestart && (
          <div className="flex items-center justify-between bg-warning/15 border border-warning text-text rounded-md px-3 py-2.5 mb-3 text-xs">
            <span>Restart {providerConfig?.brand.name ?? 'Claude'} to apply plugin changes</span>
            <button
              type="button"
              className="ml-3 px-2.5 py-1 rounded bg-button text-white text-xs border-0"
            >
              Restart
            </button>
          </div>
        )}

        <div className="flex border-b border-border gap-1 mb-3">
          {(
            [
              { id: 'plugins' as const, label: 'Plugins', count: installed.length },
              { id: 'marketplaces' as const, label: 'Marketplaces', count: marketplaces.length },
            ] as const
          ).map(({ id, label, count }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                'px-3 py-2 text-sm border-b-2 -mb-px transition-colors',
                activeTab === id
                  ? 'border-accent text-text font-medium'
                  : 'border-transparent text-text-muted hover:text-text',
              )}
            >
              {label}
              {count > 0 && (
                <span className="ml-1.5 bg-button text-white rounded-lg px-1.5 py-0.5 text-xs">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 min-h-0" style={{ height: '400px' }}>
          {activeTab === 'plugins' && (
            <InstalledPluginList
              installed={installed}
              available={available}
              marketplaces={marketplaces}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onToggle={toggle}
              onUninstall={uninstall}
              onInstall={install}
              installing={installing}
            />
          )}

          {activeTab === 'marketplaces' && (
            <MarketplaceSection
              marketplaces={marketplaces}
              newSource={newMarketplaceSource}
              onNewSourceChange={setNewMarketplaceSource}
              onAdd={handleAddMarketplace}
              onRemove={removeMarketplace}
              onRefresh={refreshMarketplaces}
              adding={adding}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
