import type { McpServerInfo, ProviderClientConfig } from '@code-quest/shared';
import { lazy, Suspense, useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import type { ChannelConfigValue } from '../contexts/channel/ChannelConfigContext';
import type { ChannelMessagesValue } from '../contexts/channel/ChannelMessagesContext';
import { generalConfigSignal } from '../features/general-config/general-config-feature';
import { RewindDialog } from '../features/rewind/RewindDialog';
import { rewindOpenSignal } from '../features/rewind/rewind-feature';
import { switchAccountSignal } from '../features/switch-account/switch-account-feature';
import { usageOpenSignal } from '../features/usage/usage-feature';

const AccountUsageDialog = lazy(() =>
  import('../features/usage/AccountUsageDialog').then((m) => ({ default: m.AccountUsageDialog })),
);
const AuthDialog = lazy(() => import('./AuthDialog').then((m) => ({ default: m.AuthDialog })));
const InitOptionsDialog = lazy(() =>
  import('./InitOptionsDialog').then((m) => ({ default: m.InitOptionsDialog })),
);
const ManageMcpDialog = lazy(() =>
  import('./ManageMcpDialog').then((m) => ({ default: m.ManageMcpDialog })),
);
const ManagePluginsDialog = lazy(() =>
  import('./ManagePluginsDialog').then((m) => ({ default: m.ManagePluginsDialog })),
);

export type ActiveDialog = 'modelPicker' | 'manageMcp' | 'mcpStatus' | 'plugins' | null;

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
}: ToolbarDialogsProps): React.JSX.Element {
  const isUsageOpen = useSyncExternalStore(
    (cb) => usageOpenSignal.subscribe(cb),
    () => usageOpenSignal.isOpen,
  );
  const isRewindOpen = useSyncExternalStore(
    (cb) => rewindOpenSignal.subscribe(cb),
    () => rewindOpenSignal.isOpen,
  );
  const isGeneralConfigOpen = useSyncExternalStore(
    (cb) => generalConfigSignal.subscribe(cb),
    () => generalConfigSignal.isOpen,
  );
  const isSwitchAccountOpen = useSyncExternalStore(
    (cb) => switchAccountSignal.subscribe(cb),
    () => switchAccountSignal.isOpen,
  );
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
      {isGeneralConfigOpen && (
        <Suspense fallback={null}>
          <InitOptionsDialog
            open
            onClose={() => generalConfigSignal.setOpen(false)}
            onSave={(opts) => setInitOptions(opts)}
            initial={initOptions}
          />
        </Suspense>
      )}
      {isUsageOpen && (
        <Suspense fallback={null}>
          <AccountUsageDialog
            open
            onClose={() => usageOpenSignal.setOpen(false)}
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
          <ManagePluginsDialog open onClose={closeDialog} />
        </Suspense>
      )}
      {isSwitchAccountOpen && (
        <Suspense fallback={null}>
          <AuthDialog open onClose={() => switchAccountSignal.setOpen(false)} />
        </Suspense>
      )}
      {isRewindOpen && (
        <RewindDialog
          open
          onClose={() => rewindOpenSignal.setOpen(false)}
          onConfirm={({ messageId, promptText }) => {
            rewindOpenSignal.setOpen(false);
            rewindToMessage(messageId)
              .then((result) => {
                if (result.ok && result.data.canRewind) {
                  forkSession(messageId).catch((err) => {
                    console.error('Fork session failed:', err);
                    toast.error('Failed to fork session');
                  });
                  updateValue(promptText);
                } else {
                  const errMessage = result.ok ? result.data.error : result.error;
                  toast.error(errMessage ?? 'Failed to rewind');
                }
              })
              .catch((err) => {
                console.error('Rewind failed:', err);
                toast.error('Failed to rewind');
              });
          }}
        />
      )}
    </>
  );
}
