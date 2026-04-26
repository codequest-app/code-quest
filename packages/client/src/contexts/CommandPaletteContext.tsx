import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from 'react';

export interface PaletteActions {
  onAddProject?: () => void;
  onOpenSettings?: () => void;
}

interface CommandPaletteState {
  open: boolean;
  defaultTab?: string;
  openPalette(opts?: { tab?: string }): void;
  closePalette(): void;
  registerJumpTo(channelId: string, fn: (messageId: string) => void): void;
  unregisterJumpTo(channelId: string): void;
  jumpTo(channelId: string, messageId: string): void;
  paletteActions: PaletteActions;
  registerActions(actions: PaletteActions): void;
}

const CommandPaletteContext = createContext<CommandPaletteState | null>(null);

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<string | undefined>();
  const jumpToMapRef = useRef(new Map<string, (messageId: string) => void>());
  const [paletteActions, setPaletteActions] = useState<PaletteActions>({});

  const openPalette = useCallback((opts?: { tab?: string }) => {
    setDefaultTab(opts?.tab);
    setOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
  }, []);

  const registerJumpTo = useCallback((channelId: string, fn: (messageId: string) => void) => {
    jumpToMapRef.current.set(channelId, fn);
  }, []);

  const unregisterJumpTo = useCallback((channelId: string) => {
    jumpToMapRef.current.delete(channelId);
  }, []);

  const jumpTo = useCallback((channelId: string, messageId: string) => {
    jumpToMapRef.current.get(channelId)?.(messageId);
  }, []);

  const registerActions = useCallback((actions: PaletteActions) => {
    setPaletteActions(actions);
  }, []);

  return (
    <CommandPaletteContext.Provider
      value={{
        open,
        defaultTab,
        openPalette,
        closePalette,
        registerJumpTo,
        unregisterJumpTo,
        jumpTo,
        paletteActions,
        registerActions,
      }}
    >
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette(): CommandPaletteState {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error('useCommandPalette must be used within CommandPaletteProvider');
  return ctx;
}
