import type {
  ChatStats,
  ControlDiffReviewPayload,
  ControlElicitationPayload,
  PlanCommentData,
} from '@code-quest/shared';
import type { Message, SessionStatus } from './ui';

export interface TerminalSession {
  id: string;
  title: string;
  outputLines: string[];
}

export type PendingElicitation = Omit<ControlElicitationPayload, 'channelId'>;

export type PendingDiffReview = Omit<ControlDiffReviewPayload, 'channelId'>;

export interface ChannelState {
  channelId: string;
  messages: Message[];
  status: SessionStatus;
  stats: ChatStats | null;
  statusText: string | null;
  isContextCompressed: boolean;
  modifiedFiles: Record<string, { oldContent?: string | null; newContent?: string | null }>;
  planComments: PlanCommentData[];
  terminalSessions: Record<string, TerminalSession>;
}

export function initialChannelState(channelId: string): ChannelState {
  return {
    channelId,
    messages: [],
    status: 'idle',
    stats: null,
    statusText: null,
    isContextCompressed: false,
    modifiedFiles: {},
    planComments: [],
    terminalSessions: {},
  };
}

export interface FileSnapshot {
  messageId: string;
  filePath: string;
  oldContent: string;
  newContent: string;
  timestamp: number;
}

export interface InitOptions {
  [key: string]: unknown;
  systemPrompt?: string;
  appendSystemPrompt?: string;
}

export type ChannelInitialState = Partial<ChannelState> & {
  // Config fields passed through to ChannelConfigProvider
  model?: string | null;
  availableModels?: Array<{ value: string; label?: string; displayName?: string }>;
  mcpServers?: Array<{ name: string; status: string; scope?: string }>;
  tools?: string[];
  permissionMode?: string | null;
  thinkingLevel?: string;
  effort?: 'low' | 'medium' | 'high' | 'max' | null;
  fastModeState?: string | null;
  config?: Record<string, unknown>;
  currentRepo?: string | null;
  slashCommands?: string[];
  // Pending controls for ActionsProvider
  pendingControls?: PendingControl[];
};

export interface PendingControl {
  requestId: string;
  subtype: string;
  toolName?: string;
  input?: unknown;
  toolUseId?: string;
  permissionSuggestions?: unknown[];
  callbackId?: string;
}
