import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ToolUseBlock } from '../ToolUseBlock.tsx';

describe('ToolUseBlock', () => {
  describe('Edit tool', () => {
    it('renders unified diff from old_string/new_string', () => {
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
      expect(container.textContent).toContain('const x = 1;');
      expect(container.textContent).toContain('const x = 2;');
    });

    it('does not show result text when old_string/new_string present', () => {
      render(
        <ToolUseBlock
          toolName="Edit"
          input={{ file_path: '/app/src/main.ts', old_string: 'a', new_string: 'b' }}
          result={{ content: 'The file has been updated successfully.' }}
        />,
      );
      expect(screen.queryByText(/has been updated successfully/)).not.toBeInTheDocument();
    });

    it('falls back to ContentRenderer when no old_string/new_string', () => {
      render(
        <ToolUseBlock
          toolName="Edit"
          input={{ file_path: '/app/src/main.ts' }}
          result={{ content: 'The file has been updated successfully.' }}
        />,
      );
      expect(screen.getByText(/has been updated successfully/)).toBeInTheDocument();
    });

    it('shows streaming indicator when partialInput is incomplete JSON', () => {
      render(
        <ToolUseBlock toolName="Edit" partialInput='{"file_path": "/src/main.ts", "old_str' />,
      );
      expect(screen.getByText('Editing…')).toBeInTheDocument();
    });

    it('shows diff preview when partialInput is complete JSON with old_string/new_string', () => {
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
      expect(container.textContent).toContain('const x = 1;');
      expect(container.textContent).toContain('const x = 2;');
    });

    it('ignores partialInput when complete input exists', () => {
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
      expect(container.textContent).toContain('const x = 1;');
      expect(container.textContent).not.toContain('/wrong');
    });
  });

  describe('Write tool', () => {
    it('shows file content in IN section with syntax highlighting', () => {
      const { container } = render(
        <ToolUseBlock
          toolName="Write"
          input={{ file_path: '/src/App.tsx', content: 'export default function App() {}' }}
        />,
      );
      expect(container.querySelector('[class*="language-tsx"]')).toBeInTheDocument();
      expect(container.textContent).toContain('App');
    });

    it('shows result in OUT section', () => {
      render(
        <ToolUseBlock
          toolName="Write"
          input={{ file_path: '/src/App.tsx', content: 'const x = 1;' }}
          result={{ content: 'File created successfully.' }}
        />,
      );
      expect(screen.getByText(/File created successfully/)).toBeInTheDocument();
    });
  });

  describe('Running indicator', () => {
    it('shows Running indicator when no partialInput and no result', () => {
      render(<ToolUseBlock toolName="Bash" input={{ command: 'echo hello' }} />);
      expect(screen.getByText('Running...')).toBeInTheDocument();
    });

    it('does not show Running indicator when result present', () => {
      render(
        <ToolUseBlock
          toolName="Bash"
          input={{ command: 'echo hello' }}
          result={{ content: 'hello' }}
        />,
      );
      expect(screen.queryByText('Running...')).not.toBeInTheDocument();
    });

    it('does not show Running indicator when partialInput present', () => {
      render(<ToolUseBlock toolName="Write" partialInput='{"file_path":"/f"}' />);
      expect(screen.queryByText('Running...')).not.toBeInTheDocument();
    });
  });

  describe('Error banner', () => {
    it('shows error banner when result.is_error is true', () => {
      const { container } = render(
        <ToolUseBlock
          toolName="Bash"
          input={{ command: 'exit 1' }}
          result={{ content: 'Command failed', is_error: true }}
        />,
      );
      const banner = container.querySelector('[class*="bg-danger"]');
      expect(banner).toBeInTheDocument();
      expect(banner?.textContent).toContain('Command failed');
    });

    it('does not show error banner when result.is_error is false', () => {
      render(
        <ToolUseBlock
          toolName="Bash"
          input={{ command: 'echo hi' }}
          result={{ content: 'hi', is_error: false }}
        />,
      );
      // content shown normally, no error banner (AlertBanner element absent)
      const alertBanners = document.querySelectorAll('[class*="bg-danger"]');
      expect(alertBanners).toHaveLength(0);
    });
  });

  describe('local_agent / subagent result renders as markdown', () => {
    it('local_agent result renders as markdown', () => {
      render(
        <ToolUseBlock
          toolName="Task"
          input={{ description: 'Explore' }}
          result={{ content: '## Summary\n- item 1\n- item 2' }}
          taskType="local_agent"
        />,
      );
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('subagent result renders as markdown', () => {
      render(
        <ToolUseBlock
          toolName="Agent"
          input={{ subagent_type: 'general-purpose', description: 'Explore' }}
          result={{ content: '## Summary\n- item 1\n- item 2' }}
          taskType="subagent"
        />,
      );
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });
  });

  describe('partialInput behavior', () => {
    it('Write shows pulsing placeholder when partialInput present', () => {
      const { container } = render(
        <ToolUseBlock toolName="Write" partialInput="some partial content" />,
      );
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('Bash', () => {
    it('Bash IN command uses Highlight with bash lang for syntax coloring', () => {
      const longCommand = 'cd /very/long/path && npm run build && echo done';
      const { container } = render(
        <ToolUseBlock
          toolName="Bash"
          input={{ command: longCommand }}
          result={{ content: 'done' }}
        />,
      );
      expect(container.textContent).toContain('npm run build');
      const codeBlock = container.querySelector('[class*="language-bash"]');
      expect(codeBlock).toBeInTheDocument();
    });
  });
});
