import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from 'react';

interface PaletteActions {
  onAddProject?: () => void;
  onOpenSettings?: () => void;
}

interface CommandPaletteStateValue {
  open: boolean;
  defaultTab?: string;
  paletteActions: PaletteActions;
}

interface CommandPaletteActionsValue {
  openPalette(opts?: { tab?: string }): void;
  closePalette(): void;
  registerJumpTo(channelId: string, fn: (messageId: string) => void): void;
  unregisterJumpTo(channelId: string): void;
  jumpTo(channelId: string, messageId: string): void;
  registerActions(actions: PaletteActions): void;
}

type CommandPaletteState = CommandPaletteStateValue & CommandPaletteActionsValue;

const CommandPaletteStateContext = createContext<CommandPaletteStateValue | null>(null);
const CommandPaletteActionsContext = createContext<CommandPaletteActionsValue | null>(null);

export function CommandPaletteProvider({ children }: { children: ReactNode }): React.JSX.Element {
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

  const [actionsValue] = useState<CommandPaletteActionsValue>(() => ({
    openPalette,
    closePalette,
    registerJumpTo,
    unregisterJumpTo,
    jumpTo,
    registerActions,
  }));

  return (
    <CommandPaletteActionsContext.Provider value={actionsValue}>
      <CommandPaletteStateContext.Provider value={{ open, defaultTab, paletteActions }}>
        {children}
      </CommandPaletteStateContext.Provider>
    </CommandPaletteActionsContext.Provider>
  );
}

export function useCommandPalette(): CommandPaletteState {
  const state = useContext(CommandPaletteStateContext);
  const actions = useContext(CommandPaletteActionsContext);
  if (!state || !actions)
    throw new Error('useCommandPalette must be used within CommandPaletteProvider');
  return { ...state, ...actions };
}

export function useCommandPaletteState(): CommandPaletteStateValue {
  const state = useContext(CommandPaletteStateContext);
  if (!state) throw new Error('useCommandPaletteState must be used within CommandPaletteProvider');
  return state;
}

export function useCommandPaletteActions(): CommandPaletteActionsValue {
  const actions = useContext(CommandPaletteActionsContext);
  if (!actions)
    throw new Error('useCommandPaletteActions must be used within CommandPaletteProvider');
  return actions;
}
