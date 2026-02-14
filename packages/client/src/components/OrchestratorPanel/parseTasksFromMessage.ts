import type { SubTask } from '@code-quest/shared';

export function parseTasksFromMessage(content: string): SubTask[] | null {
  const json = extractJson(content);
  if (!json) return null;

  const tasks = json.tasks;
  if (!Array.isArray(tasks) || tasks.length === 0) return null;

  const valid = tasks
    .filter(
      (t: unknown): t is { description: string; provider?: string } =>
        typeof t === 'object' &&
        t !== null &&
        typeof (t as Record<string, unknown>).description === 'string' &&
        ((t as Record<string, unknown>).description as string).trim().length > 0,
    )
    .map((t) => ({
      description: t.description.trim(),
      provider: t.provider === 'gemini' ? ('gemini' as const) : ('claude' as const),
      ...(Array.isArray((t as Record<string, unknown>).dependsOn)
        ? { dependsOn: (t as Record<string, unknown>).dependsOn as number[] }
        : {}),
    }));

  return valid.length > 0 ? valid : null;
}

function extractJson(content: string): { tasks: unknown[] } | null {
  // Strategy 1: ```json ... ``` code block
  const codeBlockMatch = content.match(/```json\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1]);
      if (parsed && Array.isArray(parsed.tasks)) return parsed;
    } catch {
      /* fall through */
    }
  }

  // Strategy 2: raw { "tasks": [...] } JSON
  const jsonMatch = content.match(/\{[\s\S]*"tasks"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed && Array.isArray(parsed.tasks)) return parsed;
    } catch {
      /* fall through */
    }
  }

  return null;
}
