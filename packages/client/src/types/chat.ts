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

import { z } from 'zod';

export type InitOptions = {
  systemPrompt?: string;
  appendSystemPrompt?: string;
} & Record<string, unknown>;

export const initOptionsSchema: z.ZodType<InitOptions> = z
  .object({
    systemPrompt: z.string().optional(),
    appendSystemPrompt: z.string().optional(),
  })
  .catchall(z.unknown());

export type ChannelChangeUpdate = {
  title?: string;
  status?: SessionStatus;
};
