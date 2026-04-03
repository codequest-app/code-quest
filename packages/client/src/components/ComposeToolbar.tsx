import { contextUsageDataSchema } from '@code-quest/shared';
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useChannelCompose, useChannelConfig, useChannelMessages } from '../contexts/channel';
import { useSession } from '../contexts/SessionContext';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { openUrl } from '../utils/open-url';
import { AddButton } from './AddButton';
import { CommandMenu } from './CommandMenu';
import { ContextPieChart } from './ContextPieChart';
import type { McpServerInfo } from './MCPPanel';
import { PermissionModePicker } from './PermissionModePicker';
import { RewindDialog } from './RewindDialog';
import { SpeechInputButton } from './SpeechInputButton';

const AccountUsageDialog = lazy(() =>
  import('./AccountUsageDialog').then((m) => ({ default: m.AccountUsageDialog })),
);
const AuthDialog = lazy(() => import('./AuthDialog').then((m) => ({ default: m.AuthDialog })));
const InitOptionsDialog = lazy(() =>
  import('./InitOptionsDialog').then((m) => ({ default: m.InitOptionsDialog })),
);
const ManageMcpDialog = lazy(() =>
  import('./ManageMcpDialog').then((m) => ({ default: m.ManageMcpDialog })),
);
const ModelPickerPanel = lazy(() =>
  import('./ModelPickerPanel').then((m) => ({ default: m.ModelPickerPanel })),
);
const PluginsPanel = lazy(() =>
  import('./PluginsPanel').then((m) => ({ default: m.PluginsPanel })),
);

const MCP_STATUSES = new Set([
  'connected',
  'disconnected',
  'error',
  'failed',
  'needs-auth',
  'disabled',
  'connecting',
]);

const toMcpServerInfo = (s: { name: string; status: string; scope?: string }): McpServerInfo => ({
  name: s.name,
  enabled: true,
  status: MCP_STATUSES.has(s.status) ? (s.status as McpServerInfo['status']) : 'disconnected',
  scope: s.scope,
});

export interface ComposeToolbarProps {
  onResumeConversation?: () => void;
  onAttachFile?: () => void;
}

export function ComposeToolbar({ onResumeConversation, onAttachFile }: ComposeToolbarProps) {
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
    requestUsageUpdate,
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
  const { initOptions, setInitOptions } = useSession();
  const compose = useChannelCompose();

  // MCP server refresh logic (inlined from ConnectedManageMcpDialog)
  const mcpStatusRef = useRef(mcpStatus);
  useLayoutEffect(() => {
    mcpStatusRef.current = mcpStatus;
  });
  const baseMcpServers = channelMcpServers.map(toMcpServerInfo);
  const [enrichedMcpServers, setEnrichedMcpServers] = useState<McpServerInfo[] | null>(null);
  const mcpRefresh = async () => {
    const result = await mcpStatusRef.current();
    const servers = result.success ? result.response?.mcpServers : undefined;
    if (Array.isArray(servers)) {
      setEnrichedMcpServers(servers.map(toMcpServerInfo));
    } else {
      setEnrichedMcpServers(null);
    }
  };
  const mcpServers = enrichedMcpServers ?? baseMcpServers;

  type ActiveDialog =
    | 'modelPicker'
    | 'manageMcp'
    | 'mcpStatus'
    | 'initOptions'
    | 'usage'
    | 'plugins'
    | 'auth'
    | 'rewind'
    | null;
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const closeDialog = () => setActiveDialog(null);

  const pickerRef = useRef<HTMLDivElement>(null);
  const {
    isListening,
    interimTranscript,
    finalTranscript,
    resetTranscript,
    toggleListening,
    isSupported,
  } = useSpeechToText();

  // biome-ignore lint/correctness/useExhaustiveDependencies: resetTranscript/insertSlashCommand stable via React Compiler
  useEffect(() => {
    if (!finalTranscript) return;
    compose.insertSlashCommand(finalTranscript);
    resetTranscript();
  }, [finalTranscript]);

  // Auto-refresh MCP status when dialog opens
  // biome-ignore lint/correctness/useExhaustiveDependencies: mcpRefresh stable via React Compiler
  useEffect(() => {
    if (activeDialog === 'mcpStatus' && !enrichedMcpServers) {
      mcpRefresh();
    }
  }, [activeDialog, enrichedMcpServers]); // mcpRefresh stable via React Compiler

  useEffect(() => {
    if (activeDialog !== 'modelPicker') return;
    const handleMouseDown = (e: MouseEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) setActiveDialog(null);
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [activeDialog]);

  const contextPct =
    contextUsageDataSchema.safeParse(contextUsage).data?.percentage ??
    (stats?.inputTokens != null && stats.inputTokens > 0
      ? Math.min(Math.round((stats.inputTokens / (stats.contextWindow ?? 200000)) * 100), 100)
      : null);
  const showContextUsage = isContextCompressed || contextPct !== null;

  return (
    <>
      {activeDialog === 'manageMcp' && (
        <Suspense fallback={null}>
          <ManageMcpDialog
            open
            onClose={closeDialog}
            servers={mcpServers}
            onToggle={async (name, enabled) => {
              await mcpToggle(name, enabled);
              mcpRefresh();
            }}
            onReconnect={async (name) => {
              await mcpReconnect(name);
              mcpRefresh();
            }}
            onRefresh={mcpRefresh}
            onAuthenticate={mcpAuthenticate}
            onClearAuth={mcpClearAuth}
          />
        </Suspense>
      )}
      {activeDialog === 'mcpStatus' && (
        <Suspense fallback={null}>
          <ManageMcpDialog open onClose={closeDialog} servers={mcpServers} />
        </Suspense>
      )}
      {activeDialog === 'initOptions' && (
        <Suspense fallback={null}>
          <InitOptionsDialog
            open
            onClose={closeDialog}
            onSave={(opts) => setInitOptions(opts)}
            initial={initOptions}
          />
        </Suspense>
      )}
      {activeDialog === 'usage' && (
        <Suspense fallback={null}>
          <AccountUsageDialog
            open
            onClose={closeDialog}
            usage={usageQuota ?? undefined}
            contextUsage={contextUsage ?? undefined}
            stats={stats ?? undefined}
            model={accountInfo?.model}
            authMethod={accountInfo?.authMethod}
            email={accountInfo?.email}
            organization={accountInfo?.organization}
            subscriptionType={accountInfo?.subscriptionType}
            providerConfig={providerConfig}
          />
        </Suspense>
      )}
      {activeDialog === 'plugins' && (
        <Suspense fallback={null}>
          <PluginsPanel open onClose={closeDialog} />
        </Suspense>
      )}
      {activeDialog === 'auth' && (
        <Suspense fallback={null}>
          <AuthDialog open onClose={closeDialog} />
        </Suspense>
      )}
      {activeDialog === 'rewind' && (
        <RewindDialog
          open
          onClose={closeDialog}
          onConfirm={({ messageId, promptText }) => {
            closeDialog();
            rewindToMessage(messageId, false)
              .then((result) => {
                if (result.success) {
                  forkSession(messageId).catch(() => toast.error('Failed to fork session'));
                  compose.updateValue(promptText);
                } else {
                  toast.error(result.error ?? 'Failed to rewind');
                }
              })
              .catch(() => {
                toast.error('Failed to rewind');
              });
          }}
        />
      )}
      <div className="flex items-center gap-[6px] px-[8px] py-[5px] text-[13px]">
        {activeDialog === 'modelPicker' && (
          <Suspense fallback={null}>
            <div ref={pickerRef}>
              <ModelPickerPanel
                currentModel={model ?? null}
                availableModels={availableModels}
                onSwitch={setModel}
                onClose={closeDialog}
                defaultModelDescription={providerConfig?.defaultModelDescription}
              />
            </div>
          </Suspense>
        )}

        <AddButton onAttachFile={onAttachFile} onMentionFile={compose.mentionFile} />

        <CommandMenu
          onOpenModelPicker={() => setActiveDialog('modelPicker')}
          onOpenAccountUsage={() => {
            setActiveDialog('usage');
            requestUsageUpdate();
          }}
          onToggleMcp={() => setActiveDialog('manageMcp')}
          onMcpStatus={() => setActiveDialog('mcpStatus')}
          onResumeConversation={onResumeConversation}
          onManagePlugins={() => setActiveDialog('plugins')}
          onOpenConfig={() => setActiveDialog('initOptions')}
          onSwitchAccount={() => setActiveDialog('auth')}
          onOpenHelp={() =>
            openUrl(
              providerConfig?.brand.docsUrl ??
                'https://docs.anthropic.com/en/docs/claude-code/overview',
            )
          }
          onAttachFile={onAttachFile}
          onRewind={() => setActiveDialog('rewind')}
        />

        {showContextUsage && (
          <span className="text-text-muted shrink-0 flex items-center gap-[3px]">
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
          onSetPermissionMode={setPermissionMode}
          onSetEffort={setEffort}
        />

        {isProcessing ? (
          <button
            type="button"
            title="Stop"
            disabled={isCancelling}
            onClick={abort}
            className="w-[26px] h-[26px] flex items-center justify-center rounded text-white text-xs transition-colors disabled:opacity-50 send-btn"
          >
            ■
          </button>
        ) : (
          <button
            type="button"
            title="Send"
            disabled={!compose.hasText}
            onClick={compose.submit}
            className="w-[26px] h-[26px] flex items-center justify-center rounded text-white text-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed send-btn"
          >
            ↑
          </button>
        )}
        <SpeechInputButton
          isListening={isListening}
          onToggle={toggleListening}
          isSupported={isSupported}
          interimText={interimTranscript || undefined}
        />
      </div>
    </>
  );
}
