import type { McpServerInfo, ProviderClientConfig } from '@code-quest/shared';
import { lazy, Suspense } from 'react';
import { toast } from 'sonner';
import type { ChannelConfigValue } from '../contexts/channel/ChannelConfigContext';
import type { ChannelMessagesValue } from '../contexts/channel/ChannelMessagesContext';
import { RewindDialog } from './RewindDialog';

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
const PluginsPanel = lazy(() =>
  import('./PluginsPanel').then((m) => ({ default: m.PluginsPanel })),
);

export type ActiveDialog =
  | 'modelPicker'
  | 'manageMcp'
  | 'mcpStatus'
  | 'initOptions'
  | 'usage'
  | 'plugins'
  | 'auth'
  | 'rewind'
  | null;

export interface ToolbarDialogsProps {
  activeDialog: ActiveDialog;
  closeDialog: () => void;
  mcpServers: McpServerInfo[];
  mcpToggle: ChannelConfigValue['mcpToggle'];
  mcpReconnect: ChannelConfigValue['mcpReconnect'];
  mcpRefresh: () => Promise<void>;
  mcpAuthenticate: ChannelConfigValue['mcpAuthenticate'];
  mcpClearAuth: ChannelConfigValue['mcpClearAuth'];
  initOptions: Record<string, unknown>;
  setInitOptions: (opts: Record<string, unknown>) => void;
  usageQuota: ChannelConfigValue['usageQuota'];
  contextUsage: ChannelConfigValue['contextUsage'];
  stats: ChannelMessagesValue['stats'];
  accountInfo: ChannelConfigValue['accountInfo'];
  providerConfig: ProviderClientConfig | undefined;
  rewindToMessage: ChannelMessagesValue['rewindToMessage'];
  forkSession: ChannelMessagesValue['forkSession'];
  updateValue: (value: string) => void;
}

export function ToolbarDialogs({
  activeDialog,
  closeDialog,
  mcpServers,
  mcpToggle,
  mcpReconnect,
  mcpRefresh,
  mcpAuthenticate,
  mcpClearAuth,
  initOptions,
  setInitOptions,
  usageQuota,
  contextUsage,
  stats,
  accountInfo,
  providerConfig,
  rewindToMessage,
  forkSession,
  updateValue,
}: ToolbarDialogsProps) {
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
                if (result.ok && result.data.canRewind) {
                  forkSession(messageId).catch(() => toast.error('Failed to fork session'));
                  updateValue(promptText);
                } else {
                  const errMessage = result.ok ? result.data.error : result.error;
                  toast.error(errMessage ?? 'Failed to rewind');
                }
              })
              .catch(() => {
                toast.error('Failed to rewind');
              });
          }}
        />
      )}
    </>
  );
}
