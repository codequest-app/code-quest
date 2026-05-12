import type { Message } from '@/types/ui';

const TIMELINE_TYPES = new Set([
  'text',
  'thinking',
  'tool_use',
  'streamlined_text',
  'assistant_turn',
]);

export type RenderGroup =
  | { kind: 'timeline'; messages: Message[]; prevRole: string | null }
  | { kind: 'single'; message: Message; prevRole: string | null };

export function* renderableGroups(messages: Message[]): Generator<RenderGroup> {
  let timelineGroup: Message[] = [];
  let groupPrevRole: string | null = null;
  let prevRole: string | null = null;

  for (const msg of messages) {
    if (msg.type === 'tool_result') continue;
    if (msg.parentToolUseId) continue;

    const isTimeline = msg.role === 'assistant' && TIMELINE_TYPES.has(msg.type);
    if (isTimeline) {
      if (timelineGroup.length === 0) groupPrevRole = prevRole;
      timelineGroup.push(msg);
    } else {
      if (timelineGroup.length > 0) {
        yield { kind: 'timeline', messages: timelineGroup, prevRole: groupPrevRole };
        timelineGroup = [];
      }
      yield { kind: 'single', message: msg, prevRole };
    }
    prevRole = msg.role;
  }
  if (timelineGroup.length > 0) {
    yield { kind: 'timeline', messages: timelineGroup, prevRole: groupPrevRole };
    timelineGroup = [];
  }
}

export function buildChildrenIndex(messages: Message[]): Map<string, Message[]> {
  const index = new Map<string, Message[]>();
  for (const msg of messages) {
    if (!msg.parentToolUseId) continue;
    const arr = index.get(msg.parentToolUseId);
    if (arr) {
      arr.push(msg);
    } else {
      index.set(msg.parentToolUseId, [msg]);
    }
  }
  return index;
}

export function getGroupKey(group: RenderGroup, index: number): string {
  if (group.kind === 'timeline') {
    return group.messages[0]?.id ?? `timeline-${index}`;
  }
  return group.message.id;
}
