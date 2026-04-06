import type {
  ChatStats,
  ControlDiffReviewPayload,
  ControlElicitationPayload,
  PlanCommentData,
} from '@code-quest/shared';
import type { Message, SessionStatus } from './ui';

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

export type ChannelChangeUpdate = {
  title?: string;
  status?: SessionStatus;
};
