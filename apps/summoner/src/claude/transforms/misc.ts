import type { ClientMessage } from '@code-quest/shared';
import type { z } from 'zod';
import type { errorSchema, notificationSchema, speechToTextMessageSchema } from '../schemas.ts';

type NotificationMessage = z.infer<typeof notificationSchema>;
type ErrorMessage = z.infer<typeof errorSchema>;
type SpeechToTextMessage = z.infer<typeof speechToTextMessageSchema>;

export function transformNotification(raw: NotificationMessage): ClientMessage {
  return {
    name: 'notification:toast',
    payload: { message: raw.message },
  };
}

export function transformError(raw: ErrorMessage): ClientMessage {
  return {
    name: 'error:message',
    payload: { message: raw.error?.message ?? 'Unknown error' },
  };
}

export function transformSpeechToText(raw: SpeechToTextMessage): ClientMessage {
  return {
    name: 'speech:message',
    payload: { text: raw.text, done: raw.done },
  };
}
