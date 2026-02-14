export const TASK_GENERATION_PROMPT = `Based on our discussion, please break down the work into sub-tasks that can be executed by separate AI workers.

Each task description must be self-contained — include enough context, file paths, and specific instructions for a worker to execute without access to this conversation.

If a task depends on another task completing first, use the "dependsOn" field with 0-based task indices. Tasks without dependencies run in parallel.

Reply with the following JSON format (inside a \`\`\`json code block):

\`\`\`json
{
  "tasks": [
    { "description": "detailed task description...", "provider": "claude" },
    { "description": "depends on first task...", "provider": "claude", "dependsOn": [0] }
  ]
}
\`\`\`

Rules:
- Tasks without dependsOn (or with empty dependsOn) run in parallel
- Tasks with dependsOn wait for those tasks to complete first
- Use "claude" or "gemini" as provider
- Keep tasks focused — one clear objective per task
- Include relevant file paths and specific requirements in description`;
