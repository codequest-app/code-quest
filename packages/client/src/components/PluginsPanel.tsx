import { useState } from 'react';
import { usePlugins } from '../contexts/PluginContext';
import { InstalledPluginList } from './InstalledPluginList';
import { MarketplaceSection } from './MarketplaceSection';
import { XIcon } from './ui/Icons';

interface PluginsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function PluginsPanel({ open, onClose }: PluginsPanelProps) {
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

  const [activeTab, setActiveTab] = useState<'plugins' | 'marketplaces'>('plugins');
  const [searchQuery, setSearchQuery] = useState('');
  const [newMarketplaceSource, setNewMarketplaceSource] = useState('');
  const [adding, setAdding] = useState(false);

  // Refresh data when dialog opens
  const [lastOpen, setLastOpen] = useState(false);
  if (open && !lastOpen) {
    setLastOpen(true);
    refreshPlugins();
    refreshMarketplaces();
  }
  if (!open && lastOpen) {
    setLastOpen(false);
  }

  const handleAddMarketplace = async () => {
    if (!newMarketplaceSource.trim()) return;
    setAdding(true);
    await addMarketplace(newMarketplaceSource.trim());
    setNewMarketplaceSource('');
    setAdding(false);
  };

  if (!open) return null;

  return (
    <div
      role="none"
      className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-black/50"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div
        role="dialog"
        aria-label="Manage Plugins"
        tabIndex={-1}
        className="bg-bg border border-border rounded-lg flex flex-col w-[600px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-64px)] m-4 p-4 select-text"
        style={{ outline: 'none' }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[1.1em] font-medium text-text m-0">Manage Plugins</h3>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="text-text/70 hover:text-text transition-colors flex items-center justify-center"
          >
            <XIcon />
          </button>
        </div>

        {needsRestart && (
          <div className="flex items-center justify-between bg-warning/15 border border-warning text-text rounded-md px-3 py-2.5 mb-3 text-[0.85em]">
            <span>Restart Claude to apply plugin changes</span>
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
              className={`px-3 py-2 text-[0.9em] border-b-2 mb-[-1px] transition-colors ${activeTab === id ? 'border-accent text-text font-medium' : 'border-transparent text-text-muted hover:text-text'}`}
            >
              {label}
              {count > 0 && (
                <span className="ml-1.5 bg-button text-white rounded-[10px] px-1.5 py-0.5 text-[0.75em]">
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
      </div>
    </div>
  );
}
