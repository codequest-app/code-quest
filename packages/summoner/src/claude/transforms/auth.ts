import type { ClientMessage } from '../../types.ts';
import { isRecord } from '../../utils.ts';
import type { ProtocolMessage } from '../schemas.ts';

export function transformAuthStatus(message: ProtocolMessage): ClientMessage {
  return {
    name: 'notification:auth_status',
    payload: {
      status: message.isAuthenticating ? 'authenticating' : 'authenticated',
      output: Array.isArray(message.output) ? message.output.join('\n') : undefined,
      account: isRecord(message.account) ? message.account : undefined,
    },
  };
}
