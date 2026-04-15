import type { McpServerInfo } from '@code-quest/shared';
import { contextUsageDataSchema } from '@code-quest/shared';
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useChannelCompose, useChannelConfig, useChannelMessages } from '../contexts/channel';
import { useSession } from '../contexts/SessionContext';
import { useClickOutside } from '../hooks/useClickOutside';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { openUrl } from '../utils/open-url';
import { AddButton } from './AddButton';
import { CommandMenu } from './CommandMenu';
import { ContextPieChart } from './ContextPieChart';
import { PermissionModePicker } from './PermissionModePicker';
import { SpeechInputButton } from './SpeechInputButton';
import { type ActiveDialog, ToolbarDialogs } from './ToolbarDialogs';

const DEFAULT_CONTEXT_WINDOW = 200_000;

const ModelPickerPanel = lazy(() =>
  import('./ModelPickerPanel').then((m) => ({ default: m.ModelPickerPanel })),
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

function isMcpStatus(status: string): status is McpServerInfo['status'] {
  return MCP_STATUSES.has(status);
}

const toMcpServerInfo = (s: { name: string; status: string; scope?: string }): McpServerInfo => ({
  name: s.name,
  enabled: true,
  status: isMcpStatus(s.status) ? s.status : 'disconnected',
  scope: s.scope,
});

export interface ComposeToolbarProps {
  onResumeConversation?: () => void;
  onAttachFile?: () => void;
  onAskSideQuestion?: (question: string) => void;
}

export function ComposeToolbar({
  onResumeConversation,
  onAttachFile,
  onAskSideQuestion,
}: ComposeToolbarProps) {
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

  useClickOutside([pickerRef], () => setActiveDialog(null), activeDialog === 'modelPicker');

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
          onAskSideQuestion={onAskSideQuestion}
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
