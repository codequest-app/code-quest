import { segments as s } from '@code-quest/summoner/test';
import { buildChannelState } from '../test/build-channel-state';
import type { ChannelState } from '../types/chat';

export const simpleQAState: Partial<ChannelState> = buildChannelState([
  s.user('What does this project do?'),
  s.assistant(
    'This is a **chat interface** for Claude Code. It provides:\n\n- Real-time conversation with Claude\n- Tool execution (Bash, Read, Edit, etc.)\n- Permission management for tool approval\n- Session history and context management\n\nThe frontend is built with React + Tailwind, communicating with a Node.js backend via WebSocket.',
  ),
  s.result(),
]);
