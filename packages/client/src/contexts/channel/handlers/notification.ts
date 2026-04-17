import { toast } from 'sonner';
import { showNotificationToast } from '@/components/NotificationToast';
import type { TypedSocket } from '@/socket/client';
import { channelEmit } from '@/socket/rpc';
import type { ChannelState } from '@/types/chat';
import { msg } from '@/utils/message';
import { openUrl } from '@/utils/open-url';
import type { Payload } from './guard';

// ── On handlers (state part) ──

function onNotificationShow(state: ChannelState, p: Payload<'notification:show'>): ChannelState {
  return {
    ...state,
    messages: [...state.messages, msg({ role: 'system', type: 'text', content: p.message })],
  };
}

function onRawEvent(state: ChannelState, p: Payload<'raw:event'>): ChannelState {
  switch (p.rawType) {
    case 'tool_use':
      return {
        ...state,
        messages: [
          ...state.messages,
          msg({
            role: 'assistant',
            type: 'tool_use',
            content: typeof p.data.name === 'string' ? p.data.name : '',
            meta: { toolId: p.data.id, input: p.data.input },
          }),
        ],
      };
    case 'unknown_delta':
      return {
        ...state,
        messages: [
          ...state.messages,
          msg({
            role: 'system',
            type: 'unknown_delta',
            content: `Unknown delta: ${p.data.deltaType}`,
            meta: { deltaType: p.data.deltaType, data: p.data },
          }),
        ],
      };
    case 'new_session_notification':
    case 'control_request/open_in_editor':
      return state;
    default:
      return {
        ...state,
        messages: [
          ...state.messages,
          msg({
            role: 'system',
            type: 'raw_event',
            content: `Raw: ${p.rawType}`,
            meta: { rawType: p.rawType, data: p.data },
          }),
        ],
      };
  }
}

export const notificationHandlerOn = {
  'notification:show': onNotificationShow,
  'raw:event': onRawEvent,
} satisfies Record<string, (state: ChannelState, payload: never) => ChannelState>;

// ── Effect handlers (side effects) ──

export interface EffectDeps {
  socket: TypedSocket;
  channelId: string;
}

function onNotificationToast(_deps: EffectDeps, p: Payload<'notification:toast'>): void {
  toast.info(p.message ?? '');
}

function onNotificationAuthUrl(_deps: EffectDeps, p: Payload<'notification:auth_url'>): void {
  toast.info(`Authentication required (${p.method})`, {
    duration: 30_000,
    action: { label: 'Open', onClick: () => openUrl(p.url) },
  });
}

function onActionOpenUrl(_deps: EffectDeps, p: Payload<'action:open_url'>): void {
  openUrl(p.url);
}

function onActionOpenFile(_deps: EffectDeps, p: Payload<'action:open_file'>): void {
  const loc = p.location
    ? ` (line ${p.location.startLine ?? '?'}${p.location.endLine ? `–${p.location.endLine}` : ''})`
    : '';
  toast.info(`Open file: ${p.filePath}${loc}`);
}

function onNotificationShowEffect(
  deps: EffectDeps,
  p: Payload<'notification:show'> & { requestId?: string },
): void {
  const severity = p.severity ?? 'info';
  const reqId = p.requestId;
  if (p.buttons?.length && reqId) {
    showNotificationToast(p.message ?? '', severity, p.buttons, (response) =>
      channelEmit(deps.socket, deps.channelId, 'chat:respond', {
        requestId: reqId,
        response,
      }),
    );
    return;
  }
  const showToast =
    severity === 'error' ? toast.error : severity === 'warning' ? toast.warning : toast.info;
  showToast(p.message ?? '');
}

function onRawEventEffect(deps: EffectDeps, p: Payload<'raw:event'>): void {
  if (p.rawType === 'new_session_notification') {
    toast.info('New session started');
  } else if (p.rawType === 'control_request/open_in_editor') {
    toast.info('Open in Editor is not supported in web mode');
    channelEmit(deps.socket, deps.channelId, 'chat:respond', {
      requestId: String(p.data.requestId),
      response: { behavior: 'allow' },
    });
  }
}

function onMirrorError(_deps: EffectDeps, p: Payload<'system:mirror_error'>): void {
  toast.warning(`Mirror sync error: ${p.error}`);
}

function onDisconnectEffect(): void {
  toast.warning('Disconnected from server');
}

export const notificationHandlerEffects = {
  'notification:toast': onNotificationToast,
  'notification:auth_url': onNotificationAuthUrl,
  'action:open_url': onActionOpenUrl,
  'action:open_file': onActionOpenFile,
  'notification:show': onNotificationShowEffect,
  'raw:event': onRawEventEffect,
  'system:mirror_error': onMirrorError,
  disconnect: onDisconnectEffect,
} satisfies Record<string, (deps: EffectDeps, payload: never) => void>;
