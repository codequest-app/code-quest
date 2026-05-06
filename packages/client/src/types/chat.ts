import type {
  ChatStats,
  ControlDiffReviewPayload,
  ControlElicitationPayload,
  PlanCommentData,
} from '@code-quest/shared';
import type { Message, SessionStatus } from './ui.ts';

interface TerminalSession {
  id: string;
  title: string;
  outputLines: string[];
}

export type PendingElicitation = Omit<ControlElicitationPayload, 'channelId'>;

export type PendingDiffReview = Omit<ControlDiffReviewPayload, 'channelId'>;

export interface ChannelState {
  channelId: string;
  messages: Message[];
  historyMessages: string[];
  status: SessionStatus;
  stats: ChatStats | null;
  statusText: string | null;
  isContextCompressed: boolean;
  modifiedFiles: Record<string, { oldContent?: string | null; newContent?: string | null }>;
  planComments: PlanCommentData[];
  terminalSessions: Record<string, TerminalSession>;
  isTextStreaming: boolean;
  isThinkingStreaming: boolean;
  wasStreamedViaDelta: boolean;
}

export function initialChannelState(channelId: string): ChannelState {
  return {
    channelId,
    messages: [],
    historyMessages: [],
    status: 'idle',
    stats: null,
    statusText: null,
    isContextCompressed: false,
    modifiedFiles: {},
    planComments: [],
    terminalSessions: {},
    isTextStreaming: false,
    isThinkingStreaming: false,
    wasStreamedViaDelta: false,
  };
}

export interface FileSnapshot {
  messageId: string;
  filePath: string;
  oldContent: string;
  newContent: string;
  timestamp: number;
}

export type InitOptions = {
  systemPrompt?: string;
  appendSystemPrompt?: string;
} & Record<string, unknown>;

export type ChannelChangeUpdate = {
  title?: string;
  status?: SessionStatus;
};
