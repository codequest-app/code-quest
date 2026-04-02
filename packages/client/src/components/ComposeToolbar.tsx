import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useChannelCompose, useChannelConfig, useChannelMessages } from '../contexts/channel';
import { useSession } from '../contexts/SessionContext';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { openUrl } from '../utils/open-url';
import { AccountUsageDialog } from './AccountUsageDialog';
import { AddButton } from './AddButton';
import { AuthDialog } from './AuthDialog';
import { CommandMenu } from './CommandMenu';
import { ContextPieChart } from './ContextPieChart';
import { InitOptionsDialog } from './InitOptionsDialog';
import { ManageMcpDialog } from './ManageMcpDialog';
import type { McpServerInfo } from './MCPPanel';
import { ModelPickerPanel } from './ModelPickerPanel';
import { PermissionModePicker } from './PermissionModePicker';
import { PluginsPanel } from './PluginsPanel';
import { SpeechInputButton } from './SpeechInputButton';

const toMcpServerInfo = (s: { name: string; status: string; scope?: string }): McpServerInfo => ({
  name: s.name,
  enabled: true,
  status: s.status as McpServerInfo['status'],
  scope: s.scope,
});

export interface ComposeToolbarProps {
  onResumeConversation?: () => void;
  onAttachFile?: () => void;
}

export function ComposeToolbar({ onResumeConversation, onAttachFile }: ComposeToolbarProps) {
  const { isProcessing, isCancelling, stats, isContextCompressed, abort } = useChannelMessages();
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
  const baseMcpServers = useMemo(() => channelMcpServers.map(toMcpServerInfo), [channelMcpServers]);
  const [enrichedMcpServers, setEnrichedMcpServers] = useState<McpServerInfo[] | null>(null);
  const mcpRefresh = useCallback(async () => {
    const result = await mcpStatusRef.current();
    if (result.success && result.response?.mcpServers) {
      setEnrichedMcpServers(result.response.mcpServers as McpServerInfo[]);
    } else {
      setEnrichedMcpServers(null);
    }
  }, []);
  const mcpServers = enrichedMcpServers ?? baseMcpServers;

  type ActiveDialog =
    | 'modelPicker'
    | 'manageMcp'
    | 'mcpStatus'
    | 'initOptions'
    | 'usage'
    | 'plugins'
    | 'auth'
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

  useEffect(() => {
    if (!finalTranscript) return;
    compose.insertSlashCommand(finalTranscript);
    resetTranscript();
  }, [finalTranscript, compose.insertSlashCommand, resetTranscript]);

  // Auto-refresh MCP status when dialog opens
  useEffect(() => {
    if (activeDialog === 'mcpStatus' && !enrichedMcpServers) {
      mcpRefresh();
    }
  }, [activeDialog, enrichedMcpServers, mcpRefresh]);

  useEffect(() => {
    if (activeDialog !== 'modelPicker') return;
    const handleMouseDown = (e: MouseEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) setActiveDialog(null);
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [activeDialog]);

  const contextPct =
    (contextUsage as { percentage?: number } | null)?.percentage ??
    (stats?.inputTokens != null && stats.inputTokens > 0
      ? Math.min(Math.round((stats.inputTokens / (stats.contextWindow ?? 200000)) * 100), 100)
      : null);
  const showContextUsage = isContextCompressed || contextPct !== null;

  return (
    <>
      <ManageMcpDialog
        open={activeDialog === 'manageMcp'}
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
      <ManageMcpDialog
        open={activeDialog === 'mcpStatus'}
        onClose={closeDialog}
        servers={mcpServers}
      />
      <InitOptionsDialog
        open={activeDialog === 'initOptions'}
        onClose={closeDialog}
        onSave={(opts) => setInitOptions(opts)}
        initial={initOptions}
      />
      <AccountUsageDialog
        open={activeDialog === 'usage'}
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
      <PluginsPanel open={activeDialog === 'plugins'} onClose={closeDialog} />
      <AuthDialog open={activeDialog === 'auth'} onClose={closeDialog} />
      <div className="flex items-center gap-[6px] px-[8px] py-[5px] text-[13px]">
        {activeDialog === 'modelPicker' && (
          <div ref={pickerRef}>
            <ModelPickerPanel
              currentModel={model ?? null}
              availableModels={availableModels}
              onSwitch={setModel}
              onClose={closeDialog}
              defaultModelDescription={providerConfig?.defaultModelDescription}
            />
          </div>
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
