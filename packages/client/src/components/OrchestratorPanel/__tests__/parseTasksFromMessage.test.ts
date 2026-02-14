import { describe, expect, it } from 'vitest';
import { parseTasksFromMessage } from '../parseTasksFromMessage.ts';

describe('parseTasksFromMessage', () => {
  it('should extract tasks from a ```json code block', () => {
    const content = `Here are the tasks:
\`\`\`json
{
  "tasks": [
    { "description": "Refactor auth module", "provider": "claude" },
    { "description": "Add JWT validation", "provider": "gemini" }
  ]
}
\`\`\`
Let me know if you need changes.`;

    const result = parseTasksFromMessage(content);
    expect(result).toEqual([
      { description: 'Refactor auth module', provider: 'claude' },
      { description: 'Add JWT validation', provider: 'gemini' },
    ]);
  });

  it('should extract tasks from raw JSON', () => {
    const content = `Based on our discussion, here are the tasks:
{
  "tasks": [
    { "description": "Write unit tests", "provider": "claude" }
  ]
}`;

    const result = parseTasksFromMessage(content);
    expect(result).toEqual([{ description: 'Write unit tests', provider: 'claude' }]);
  });

  it('should filter out tasks with empty descriptions', () => {
    const content = `\`\`\`json
{
  "tasks": [
    { "description": "Valid task", "provider": "claude" },
    { "description": "", "provider": "claude" },
    { "description": "   ", "provider": "gemini" }
  ]
}
\`\`\``;

    const result = parseTasksFromMessage(content);
    expect(result).toEqual([{ description: 'Valid task', provider: 'claude' }]);
  });

  it('should fallback provider to claude when not claude or gemini', () => {
    const content = `\`\`\`json
{
  "tasks": [
    { "description": "Task with unknown provider", "provider": "gpt" },
    { "description": "Task without provider" }
  ]
}
\`\`\``;

    const result = parseTasksFromMessage(content);
    expect(result).toEqual([
      { description: 'Task with unknown provider', provider: 'claude' },
      { description: 'Task without provider', provider: 'claude' },
    ]);
  });

  it('should return null when content has no JSON', () => {
    const result = parseTasksFromMessage('Just a normal message without any JSON.');
    expect(result).toBeNull();
  });

  it('should return null when JSON is malformed', () => {
    const content = `\`\`\`json
{ "tasks": [ { "description": "broken
\`\`\``;

    const result = parseTasksFromMessage(content);
    expect(result).toBeNull();
  });

  it('should parse tasks with dependsOn field', () => {
    const content = `\`\`\`json
{
  "tasks": [
    { "description": "Setup DB schema", "provider": "claude" },
    { "description": "Write API endpoints", "provider": "claude", "dependsOn": [0] }
  ]
}
\`\`\``;

    const result = parseTasksFromMessage(content);
    expect(result).toEqual([
      { description: 'Setup DB schema', provider: 'claude' },
      { description: 'Write API endpoints', provider: 'claude', dependsOn: [0] },
    ]);
  });

  it('should not include dependsOn when not present', () => {
    const content = `\`\`\`json
{
  "tasks": [
    { "description": "Simple task", "provider": "claude" }
  ]
}
\`\`\``;

    const result = parseTasksFromMessage(content);
    expect(result).toEqual([{ description: 'Simple task', provider: 'claude' }]);
    expect(result?.[0]).not.toHaveProperty('dependsOn');
  });

  it('should return null when tasks array is empty', () => {
    const content = `\`\`\`json
{ "tasks": [] }
\`\`\``;

    const result = parseTasksFromMessage(content);
    expect(result).toBeNull();
  });
});
