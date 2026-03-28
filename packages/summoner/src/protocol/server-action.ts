export type ServerAction =
  | {
      action: 'auto_respond';
      requestId: string;
      subtype: string;
      response: Record<string, unknown>;
      input?: unknown;
    }
  | {
      action: 'read_diff';
      requestId: string;
      originalPath: string;
      newPath: string;
    }
  | {
      action: 'forward_to_client';
      requestId: string;
      subtype: string;
      toolName?: string;
      toolUseId?: string;
      input?: unknown;
      suggestions?: unknown[];
      callbackId?: string;
    };
