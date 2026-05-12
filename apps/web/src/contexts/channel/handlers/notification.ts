import { EVENTS } from '@code-quest/shared';
import { toast } from 'sonner';
import { showNotificationToast } from '@/components/workspace/NotificationToast';
import type { TypedSocket } from '@/socket/client';
import { channelEmit } from '@/socket/rpc';
import type { ChannelState } from '@/types/chat';
import { msg } from '@/utils/message';
import { openUrl } from '@/utils/open-url';
import type { Payload } from './guard.ts';

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
            toolId: p.data.id,
            input: p.data.input,
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
            data: p.data,
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
            data: p.data,
          }),
        ],
      };
  }
}

export const notificationHandlerOn: {
  'notification:show': typeof onNotificationShow;
  'raw:event': typeof onRawEvent;
} = {
  'notification:show': onNotificationShow,
  'raw:event': onRawEvent,
} satisfies Record<string, (state: ChannelState, payload: never) => ChannelState>;

// ── Effect handlers (side effects) ──

export interface EffectContext {
  socket: TypedSocket;
  channelId: string;
}

function onNotificationToast(_ctx: EffectContext, p: Payload<'notification:toast'>): void {
  toast.info(p.message ?? '');
}

function onNotificationAuthUrl(_ctx: EffectContext, p: Payload<'notification:auth_url'>): void {
  toast.info(`Authentication required (${p.method})`, {
    duration: 30_000,
    action: { label: 'Open', onClick: () => openUrl(p.url) },
  });
}

function onActionOpenUrl(_ctx: EffectContext, p: Payload<'action:open_url'>): void {
  openUrl(p.url);
}

function onActionOpenFile(_ctx: EffectContext, p: Payload<'action:open_file'>): void {
  const loc = p.location
    ? ` (line ${p.location.startLine ?? '?'}${p.location.endLine ? `–${p.location.endLine}` : ''})`
    : '';
  toast.info(`Open file: ${p.filePath}${loc}`);
}

function showInteractiveNotification(
  ctx: EffectContext,
  p: Payload<'notification:show'> & { requestId: string },
): void {
  showNotificationToast(p.message ?? '', p.severity ?? 'info', p.buttons ?? [], (response) =>
    channelEmit(ctx.socket, ctx.channelId, EVENTS.chat.respond, {
      requestId: p.requestId,
      response,
    }),
  );
}

function showSeverityToast(p: Payload<'notification:show'>): void {
  const severity = p.severity ?? 'info';
  const showToast =
    severity === 'error' ? toast.error : severity === 'warning' ? toast.warning : toast.info;
  showToast(p.message ?? '');
}

function onNotificationShowEffect(
  ctx: EffectContext,
  p: Payload<'notification:show'> & { requestId?: string },
): void {
  if (p.buttons?.length && p.requestId) {
    showInteractiveNotification(ctx, { ...p, requestId: p.requestId });
    return;
  }
  showSeverityToast(p);
}

function onRawEventEffect(ctx: EffectContext, p: Payload<'raw:event'>): void {
  if (p.rawType === 'new_session_notification') {
    toast.info('New session started');
  } else if (p.rawType === 'control_request/open_in_editor') {
    toast.info('Open in Editor is not supported in web mode');
    channelEmit(ctx.socket, ctx.channelId, EVENTS.chat.respond, {
      requestId: String(p.data.requestId),
      response: { behavior: 'allow' },
    });
  }
}

function onMirrorError(_ctx: EffectContext, p: Payload<'system:mirror_error'>): void {
  toast.warning(`Mirror sync error: ${p.error}`);
}

function onDisconnectEffect(): void {
  toast.warning('Disconnected from server');
}

export const notificationHandlerEffects: {
  'notification:toast': typeof onNotificationToast;
  'notification:auth_url': typeof onNotificationAuthUrl;
  'action:open_url': typeof onActionOpenUrl;
  'action:open_file': typeof onActionOpenFile;
  'notification:show': typeof onNotificationShowEffect;
  'raw:event': typeof onRawEventEffect;
  'system:mirror_error': typeof onMirrorError;
  disconnect: typeof onDisconnectEffect;
} = {
  'notification:toast': onNotificationToast,
  'notification:auth_url': onNotificationAuthUrl,
  'action:open_url': onActionOpenUrl,
  'action:open_file': onActionOpenFile,
  'notification:show': onNotificationShowEffect,
  'raw:event': onRawEventEffect,
  'system:mirror_error': onMirrorError,
  disconnect: onDisconnectEffect,
} satisfies Record<string, (ctx: EffectContext, payload: never) => void>;
