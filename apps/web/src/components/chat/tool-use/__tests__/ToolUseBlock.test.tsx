import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ToolUseBlock } from '../ToolUseBlock.tsx';

async function expandBlock() {
  const trigger = screen.getByRole('button');
  await userEvent.setup().click(trigger);
}

describe('ToolUseBlock', () => {
  describe('Edit tool', () => {
    it('shows file path in header', () => {
      render(
        <ToolUseBlock
          toolName="Edit"
          input={{
            file_path: '/app/src/components/Header.tsx',
            old_string: 'old',
            new_string: 'new',
          }}
          result={{ content: 'The file has been updated successfully.' }}
        />,
      );
      expect(screen.getByText('Header.tsx')).toBeInTheDocument();
    });

    it('renders unified diff from old_string/new_string when expanded', async () => {
      const { container } = render(
        <ToolUseBlock
          toolName="Edit"
          input={{
            file_path: '/app/src/main.ts',
            old_string: 'const x = 1;',
            new_string: 'const x = 2;',
          }}
        />,
      );
      await expandBlock();
      expect(container.textContent).toContain('const x = 1;');
      expect(container.textContent).toContain('const x = 2;');
    });

    it('does not show result text', async () => {
      render(
        <ToolUseBlock
          toolName="Edit"
          input={{ file_path: '/app/src/main.ts', old_string: 'a', new_string: 'b' }}
          result={{ content: 'The file has been updated successfully.' }}
        />,
      );
      await expandBlock();
      expect(screen.queryByText(/has been updated successfully/)).not.toBeInTheDocument();
    });

    it('falls back to ContentRenderer when no old_string/new_string', async () => {
      render(
        <ToolUseBlock
          toolName="Edit"
          input={{ file_path: '/app/src/main.ts' }}
          result={{ content: 'The file has been updated successfully.' }}
        />,
      );
      await expandBlock();
      expect(screen.getByText(/has been updated successfully/)).toBeInTheDocument();
    });

    it('shows streaming indicator when partialInput is incomplete JSON', async () => {
      render(
        <ToolUseBlock toolName="Edit" partialInput='{"file_path": "/src/main.ts", "old_str' />,
      );
      await expandBlock();
      expect(screen.getByText('Editing…')).toBeInTheDocument();
    });

    it('shows diff preview when partialInput is complete JSON with old_string/new_string', async () => {
      const { container } = render(
        <ToolUseBlock
          toolName="Edit"
          partialInput={JSON.stringify({
            file_path: '/src/main.ts',
            old_string: 'const x = 1;',
            new_string: 'const x = 2;',
          })}
        />,
      );
      await expandBlock();
      expect(container.textContent).toContain('const x = 1;');
      expect(container.textContent).toContain('const x = 2;');
    });

    it('ignores partialInput when complete input exists', async () => {
      const { container } = render(
        <ToolUseBlock
          toolName="Edit"
          input={{
            file_path: '/src/main.ts',
            old_string: 'const x = 1;',
            new_string: 'const x = 2;',
          }}
          partialInput='{"file_path": "/wrong"}'
          result={{ content: 'Updated.' }}
        />,
      );
      await expandBlock();
      expect(container.textContent).toContain('const x = 1;');
      expect(container.textContent).not.toContain('/wrong');
    });
  });

  describe('Write tool', () => {
    it('shows file content in IN section with syntax highlighting', async () => {
      const { container } = render(
        <ToolUseBlock
          toolName="Write"
          input={{ file_path: '/src/App.tsx', content: 'export default function App() {}' }}
          defaultOpen
        />,
      );
      expect(container.querySelector('[class*="language-tsx"]')).toBeInTheDocument();
      expect(container.textContent).toContain('App');
    });

    it('shows result in OUT section', async () => {
      render(
        <ToolUseBlock
          toolName="Write"
          input={{ file_path: '/src/App.tsx', content: 'const x = 1;' }}
          result={{ content: 'File created successfully.' }}
          defaultOpen
        />,
      );
      expect(screen.getByText(/File created successfully/)).toBeInTheDocument();
    });
  });

  describe('Task block (local_bash)', () => {
    it('shows command as header detail for local_bash task', () => {
      render(
        <ToolUseBlock
          toolName="Bash"
          input={{ command: 'git add && git commit -m "refactor"', description: 'Commit changes' }}
          result={{ content: 'lefthook: biome ✓' }}
          task={{
            toolUseId: 'toolu_1',
            taskType: 'local_bash',
            status: 'completed',
            description: 'Commit changes',
          }}
        />,
      );
      expect(screen.getByText('Commit changes')).toBeInTheDocument();
    });

    it('shows [local_bash] tag', () => {
      render(
        <ToolUseBlock
          toolName="Bash"
          input={{ command: 'vitest run' }}
          task={{
            toolUseId: 'toolu_1',
            taskType: 'local_bash',
            status: 'running',
            description: 'vitest run',
          }}
        />,
      );
      expect(screen.getByText('local_bash')).toBeInTheDocument();
    });

    it('does not show Done badge for local_bash (timeline dot handles status)', () => {
      render(
        <ToolUseBlock
          toolName="Bash"
          input={{ command: 'vitest run' }}
          result={{ content: 'Tests 22 passed' }}
          task={{
            toolUseId: 'toolu_1',
            taskType: 'local_bash',
            status: 'completed',
            description: 'vitest run',
          }}
        />,
      );
      expect(screen.queryByText(/Done/)).not.toBeInTheDocument();
    });
  });

  describe('Task block (local_agent)', () => {
    it('shows task description in header for local_agent', () => {
      render(
        <ToolUseBlock
          toolName="Task"
          input={{ description: 'Verify ganyuan tokens' }}
          task={{
            toolUseId: 'toolu_1',
            taskType: 'local_agent',
            status: 'running',
            description: 'Verify ganyuan tokens',
          }}
        />,
      );
      expect(screen.getByText('Verify ganyuan tokens')).toBeInTheDocument();
    });
  });

  describe('Task props', () => {
    it('local_bash shows [local_bash] tag but no Done text (timeline handles done)', () => {
      render(
        <ToolUseBlock
          toolName="Bash"
          input={{ command: 'vitest run' }}
          task={{
            toolUseId: 'toolu_1',
            taskType: 'local_bash',
            status: 'completed',
            description: 'vitest run',
            summary: 'Tests passed',
          }}
        />,
      );
      expect(screen.getByText('local_bash')).toBeInTheDocument();
      expect(screen.queryByText(/Done/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Running/)).not.toBeInTheDocument();
    });

    it('subagent (Agent tool without task) shows [subagent] tag', () => {
      render(
        <ToolUseBlock
          toolName="Agent"
          input={{ subagent_type: 'general-purpose', description: 'Explore' }}
        />,
      );
      expect(screen.getByText('subagent')).toBeInTheDocument();
    });

    it('local_agent shows [local_agent] tag', () => {
      render(
        <ToolUseBlock
          toolName="Task"
          input={{ description: 'Explore' }}
          task={{
            toolUseId: 'toolu_1',
            taskType: 'local_agent',
            status: 'running',
            description: 'Explore',
          }}
        />,
      );
      expect(screen.getByText('local_agent')).toBeInTheDocument();
    });

    it('shows progressText in Running badge for local_agent', () => {
      render(
        <ToolUseBlock
          toolName="Task"
          input={{ description: 'Explore' }}
          task={{
            toolUseId: 'toolu_1',
            taskType: 'local_agent',
            status: 'running',
            description: 'Explore',
            progressText: 'Reading AccountAddress.tsx',
            lastToolName: 'Read',
          }}
        />,
      );
      expect(screen.getByText(/Reading AccountAddress.tsx/)).toBeInTheDocument();
    });

    it('local_agent result renders as markdown', async () => {
      render(
        <ToolUseBlock
          toolName="Task"
          input={{ description: 'Explore' }}
          result={{ content: '## Summary\n- item 1\n- item 2' }}
          task={{
            toolUseId: 'toolu_1',
            taskType: 'local_agent',
            status: 'completed',
            description: 'Explore',
          }}
          defaultOpen
        />,
      );
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('subagent result renders as markdown', async () => {
      render(
        <ToolUseBlock
          toolName="Agent"
          input={{ subagent_type: 'general-purpose', description: 'Explore' }}
          result={{ content: '## Summary\n- item 1\n- item 2' }}
          task={{
            toolUseId: 'toolu_1',
            taskType: 'subagent',
            status: 'completed',
            description: 'Explore',
          }}
          defaultOpen
        />,
      );
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('Bash IN command uses Highlight with bash lang for syntax coloring and line wrap', () => {
      const longCommand = 'cd /very/long/path && npm run build && echo done';
      const { container } = render(
        <ToolUseBlock toolName="Bash" input={{ command: longCommand }} defaultOpen />,
      );
      expect(container.textContent).toContain('npm run build');
      const codeBlock = container.querySelector('[class*="language-bash"]');
      expect(codeBlock).toBeInTheDocument();
    });

    it('uses command summary as header detail when no input.description', () => {
      render(
        <ToolUseBlock
          toolName="Bash"
          input={{ command: 'vitest run' }}
          task={{
            toolUseId: 'toolu_1',
            taskType: 'local_bash',
            status: 'running',
            description: 'Run unit tests',
          }}
        />,
      );
      expect(screen.getByText('vitest run')).toBeInTheDocument();
    });
  });
});
