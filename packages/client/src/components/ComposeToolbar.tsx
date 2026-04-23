import {
  contextUsageDataSchema,
  type McpServerInfo,
  mcpServerInfoSchema,
  type PermissionMode,
  toPermissionMode,
} from '@code-quest/shared';
import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useAppReadiness } from '../contexts/AppReadinessContext';
import { useChannelCompose, useChannelConfig, useChannelMessages } from '../contexts/channel';
import { modelOpenSignal } from '../features/model/model-feature';
import { useClickOutside } from '../hooks/useClickOutside';
import { cn } from '../utils/cn';
import { findModel, getEffortLevels } from '../utils/model-utils';
import { AddButton } from './AddButton';
import { ContextPieChart } from './ContextPieChart';
import { CommandMenu } from './command-menu/CommandMenu';
import { PermissionModePicker } from './PermissionModePicker';
import { type ActiveDialog, ToolbarDialogs } from './ToolbarDialogs';
import { IconButton } from './ui/IconButton';

const DEFAULT_CONTEXT_WINDOW = 200_000;

function SendButton({
  mode,
  isProcessing,
  isCancelling,
  hasText,
  onAbort,
  onSubmit,
}: {
  mode: PermissionMode;
  isProcessing: boolean;
  isCancelling: boolean;
  hasText: boolean;
  onAbort: () => void;
  onSubmit: () => void;
}) {
  return (
    <IconButton
      variant="plain"
      title={isProcessing ? 'Stop' : 'Send'}
      disabled={isProcessing ? isCancelling : !hasText}
      data-mode={mode}
      onClick={isProcessing ? onAbort : onSubmit}
      className={cn(
        'bg-[var(--mode-accent)] text-white',
        isProcessing
          ? 'text-xs disabled:opacity-50'
          : 'text-base disabled:opacity-40 disabled:cursor-not-allowed',
      )}
    >
      {isProcessing ? '■' : '↑'}
    </IconButton>
  );
}

const ModelPickerPopover = lazy(() =>
  import('./ModelPickerPopover').then((m) => ({ default: m.ModelPickerPopover })),
);

const mcpStatusSchema = mcpServerInfoSchema.shape.status;

const toMcpServerInfo = (s: { name: string; status: string; scope?: string }): McpServerInfo => ({
  name: s.name,
  enabled: true,
  status: mcpStatusSchema.safeParse(s.status).data ?? 'disconnected',
  scope: s.scope,
});

export interface ComposeToolbarProps {
  onAttachFile?: () => void;
}

export function ComposeToolbar({ onAttachFile }: ComposeToolbarProps) {
  const {
    isProcessing,
    isCancelling,
    stats,
    isContextCompressed,
    abort,
    rewindToMessage,
    forkSession,
  } = useChannelMessages();
  const {
    accountInfo,
    usageQuota,
    contextUsage,
    permissionMode,
    model,
    availableModels,
    effort,
    mcpServers: channelMcpServers,
    mcpStatus,
    mcpToggle,
    mcpReconnect,
    mcpAuthenticate,
    mcpClearAuth,
    setModel,
    setPermissionMode,
    setEffort,
    providerConfig,
  } = useChannelConfig();
  const { initOptions, setInitOptions } = useAppReadiness();
  const compose = useChannelCompose();

  // MCP server refresh logic (inlined from ConnectedManageMcpDialog)
  const mcpStatusRef = useRef(mcpStatus);
  useLayoutEffect(() => {
    mcpStatusRef.current = mcpStatus;
  });
  const baseMcpServers = channelMcpServers.map(toMcpServerInfo);
  const [enrichedMcpServers, setEnrichedMcpServers] = useState<McpServerInfo[] | null>(null);
  const mcpRefresh = async () => {
    try {
      const result = await mcpStatusRef.current();
      const servers = result.success ? result.response?.mcpServers : undefined;
      if (Array.isArray(servers)) {
        setEnrichedMcpServers(servers.map(toMcpServerInfo));
      } else {
        setEnrichedMcpServers(null);
      }
    } catch (e) {
      console.error('MCP refresh failed:', e);
      setEnrichedMcpServers(null);
    }
  };
  const mcpServers = enrichedMcpServers ?? baseMcpServers;

  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const closeDialog = () => setActiveDialog(null);

  const pickerRef = useRef<HTMLDivElement>(null);

  // Auto-refresh MCP status when dialog opens
  // biome-ignore lint/correctness/useExhaustiveDependencies: mcpRefresh stable via React Compiler
  useEffect(() => {
    if (activeDialog === 'mcpStatus' && !enrichedMcpServers) {
      mcpRefresh();
    }
  }, [activeDialog, enrichedMcpServers]); // mcpRefresh stable via React Compiler

  const isModelPickerOpen = useSyncExternalStore(
    (cb) => modelOpenSignal.subscribe(cb),
    () => modelOpenSignal.isOpen,
  );
  useClickOutside([pickerRef], () => modelOpenSignal.setOpen(false), isModelPickerOpen);

  const modelEntry = (model ? findModel(model, availableModels) : undefined) ?? availableModels[0];
  const supportsAutoMode = modelEntry?.supportsAutoMode ?? false;
  const effortLevels = getEffortLevels(modelEntry);

  const contextPct =
    contextUsageDataSchema.safeParse(contextUsage).data?.percentage ??
    (stats?.inputTokens != null && stats.inputTokens > 0
      ? Math.min(
          Math.round((stats.inputTokens / (stats.contextWindow ?? DEFAULT_CONTEXT_WINDOW)) * 100),
          100,
        )
      : null);
  const showContextUsage = isContextCompressed || contextPct !== null;

  return (
    <>
      <ToolbarDialogs
        activeDialog={activeDialog}
        closeDialog={closeDialog}
        mcpServers={mcpServers}
        mcpToggle={mcpToggle}
        mcpReconnect={mcpReconnect}
        mcpRefresh={mcpRefresh}
        mcpAuthenticate={mcpAuthenticate}
        mcpClearAuth={mcpClearAuth}
        initOptions={initOptions}
        setInitOptions={setInitOptions}
        usageQuota={usageQuota}
        contextUsage={contextUsage}
        stats={stats}
        accountInfo={accountInfo}
        providerConfig={providerConfig}
        rewindToMessage={rewindToMessage}
        forkSession={forkSession}
        updateValue={compose.updateValue}
      />
      <div className="flex items-center gap-0.5 px-2 py-1 text-xs">
        {isModelPickerOpen && (
          <Suspense fallback={null}>
            <div ref={pickerRef}>
              <ModelPickerPopover
                currentModel={model ?? null}
                availableModels={availableModels}
                onSwitch={setModel}
                onClose={() => modelOpenSignal.setOpen(false)}
                defaultModelDescription={providerConfig?.defaultModelDescription}
              />
            </div>
          </Suspense>
        )}

        <AddButton onAttachFile={onAttachFile} onMentionFile={compose.mentionFile} />

        <CommandMenu
          onToggleMcp={() => setActiveDialog('manageMcp')}
          onMcpStatus={() => setActiveDialog('mcpStatus')}
          onManagePlugins={() => setActiveDialog('plugins')}
          onAttachFile={onAttachFile}
          docsUrl={providerConfig?.brand.docsUrl}
        />

        {showContextUsage && (
          <span className="text-text-muted shrink-0 flex items-center gap-0.5">
            {isContextCompressed ? (
              'compact'
            ) : (
              <>
                <ContextPieChart pct={contextPct ?? 0} />
                <span>{contextPct ?? 0}% used</span>
              </>
            )}
          </span>
        )}

        <div className="flex-1" />

        <PermissionModePicker
          mode={permissionMode ?? 'normal'}
          effort={effort ?? undefined}
          effortLevels={effortLevels}
          supportsAutoMode={supportsAutoMode}
          onSetPermissionMode={setPermissionMode}
          onSetEffort={setEffort}
        />

        <SendButton
          mode={toPermissionMode(permissionMode)}
          isProcessing={isProcessing}
          isCancelling={isCancelling}
          hasText={compose.hasText}
          onAbort={abort}
          onSubmit={compose.submit}
        />
      </div>
    </>
  );
}
