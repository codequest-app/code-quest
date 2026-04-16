import { VISIBILITY_GROUPS } from '../contexts/channel/MessageVisibilityContext';
import type { Message } from '../types/ui';

/** Render a tool_use message's input as a readable preview string. */
function toolUsePreview(input: unknown): string {
  if (!input || typeof input !== 'object') return '';
  return Object.values(input as Record<string, unknown>)
    .map((v) => (typeof v === 'string' ? v : JSON.stringify(v)))
    .join(' ');
}

/** Extract a preview string from any message (tool_use shows input, others show content). */
export function messagePreview(m: Message): string {
  if (m.type === 'tool_use' && m.meta?.input) {
    return toolUsePreview(m.meta.input) || m.content;
  }
  return m.content;
}

/** Subtype keys (format: "type:toolName") that are controlled independently via VISIBILITY_GROUPS */
const SUBTYPE_OVERRIDES = new Set(
  VISIBILITY_GROUPS.flatMap((g) => g.types).filter((t) => t.includes(':')),
);

/**
 * Returns true if a message should be visible given the current enabledTypes set.
 *
 * For messages with a registered subtype override (e.g. tool_use:TodoRead),
 * visibility is controlled by the subtype key — the parent type being enabled
 * does NOT grant visibility. All other messages use a plain type check.
 */
export function isMessageVisible(message: Message, enabledTypes: Set<string>): boolean {
  // For tool_use, content holds the tool name — check "tool_use:ToolName" subtype key
  const toolSubKey = `${message.type}:${message.content}`;
  if (SUBTYPE_OVERRIDES.has(toolSubKey)) {
    return enabledTypes.has(toolSubKey);
  }
  return enabledTypes.has(message.type);
}
