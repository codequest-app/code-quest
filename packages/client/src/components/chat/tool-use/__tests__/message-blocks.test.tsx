import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderBody } from '@/components/chat/conversation/MessageContent';

describe('message-blocks', () => {
  describe('ToolUseBlock (via renderBody)', () => {
    it('renders tool_use with tool name', () => {
      render(
        renderBody({
          id: '1',
          role: 'assistant',
          type: 'tool_use',
          content: 'Bash',
          timestamp: Date.now(),
          meta: { toolId: 'tu-1', input: { command: 'ls -la' } },
        }),
      );
      expect(screen.getByText('Bash')).toBeInTheDocument();
    });

    it('Bash IN/OUT are in a single combined block (one bg-code-block container)', async () => {
      const user = userEvent.setup();
      const { container } = render(
        renderBody({
          id: '1',
          role: 'assistant',
          type: 'tool_use',
          content: 'Bash',
          timestamp: Date.now(),
          meta: {
            toolId: 'tu-1',
            input: { command: 'ls' },
            result: { content: 'file.txt' },
          },
        }),
      );
      await user.click(screen.getByText('Bash'));
      const blocks = container.querySelectorAll('.bg-code-block');
      expect(blocks).toHaveLength(1);
    });

    it('copy icon is solid (title="Copy"), changes to check after click, reverts after timeout', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        renderBody({
          id: '1',
          role: 'assistant',
          type: 'tool_use',
          content: 'Bash',
          timestamp: Date.now(),
          meta: { toolId: 'tu-1', input: { command: 'echo hi' } },
        }),
      );
      await user.click(screen.getByText('Bash'));
      const copyBtn = screen.getByTitle('Copy');
      expect(copyBtn).toBeInTheDocument();

      await user.click(copyBtn);
      expect(screen.getByTitle('Copied!')).toBeInTheDocument();
      expect(screen.queryByTitle('Copy')).not.toBeInTheDocument();
    });

    it('copy button uses heroicons svg, not emoji', async () => {
      const user = userEvent.setup();
      render(
        renderBody({
          id: '1',
          role: 'assistant',
          type: 'tool_use',
          content: 'Bash',
          timestamp: Date.now(),
          meta: { toolId: 'tu-1', input: { command: 'echo hi' } },
        }),
      );
      await user.click(screen.getByText('Bash'));
      const copyBtn = screen.getByTitle('Copy');
      expect(copyBtn.querySelector('svg')).toBeInTheDocument();
      expect(copyBtn.textContent).not.toContain('📋');
    });

    it('Bash content wraps long lines (whitespace-pre-wrap)', async () => {
      const user = userEvent.setup();
      const { container } = render(
        renderBody({
          id: '1',
          role: 'assistant',
          type: 'tool_use',
          content: 'Bash',
          timestamp: Date.now(),
          meta: {
            toolId: 'tu-1',
            input: { command: 'echo hi' },
            result: { content: 'hello world' },
          },
        }),
      );
      await user.click(screen.getByText('Bash'));
      const pres = container.querySelectorAll('pre');
      for (const pre of pres) {
        expect(pre.className).toContain('whitespace-pre-wrap');
      }
    });

    it('copy button is a grid cell (NOT absolute positioned) in IN row', async () => {
      const user = userEvent.setup();
      render(
        renderBody({
          id: '1',
          role: 'assistant',
          type: 'tool_use',
          content: 'Bash',
          timestamp: Date.now(),
          meta: { toolId: 'tu-1', input: { command: 'echo hi' } },
        }),
      );
      await user.click(screen.getByText('Bash'));
      const copyBtn = screen.getByTitle('Copy');
      expect(copyBtn.className).not.toContain('absolute');
    });

    it('renders IN label for bash tool input when expanded', async () => {
      const user = userEvent.setup();
      render(
        renderBody({
          id: '1',
          role: 'assistant',
          type: 'tool_use',
          content: 'Bash',
          timestamp: Date.now(),
          meta: { toolId: 'tu-1', input: { command: 'echo hello' } },
        }),
      );
      await user.click(screen.getByText('Bash'));
      expect(screen.getByText('IN')).toBeInTheDocument();
    });

    it('renders IN/OUT labels for default tool with input and result when expanded', async () => {
      const user = userEvent.setup();
      render(
        renderBody({
          id: '1',
          role: 'assistant',
          type: 'tool_use',
          content: 'Grep',
          timestamp: Date.now(),
          meta: {
            toolId: 'tu-1',
            input: { pattern: 'foo', path: '/src' },
            result: { content: 'found 3 matches' },
          },
        }),
      );
      await user.click(screen.getByText('Grep'));
      expect(screen.getByText('IN')).toBeInTheDocument();
      expect(screen.getByText('OUT')).toBeInTheDocument();
    });

    it('default tool (Grep) IN/OUT share one bordered box, labels are inside', async () => {
      const user = userEvent.setup();
      const { container } = render(
        renderBody({
          id: '1',
          role: 'assistant',
          type: 'tool_use',
          content: 'Grep',
          timestamp: Date.now(),
          meta: {
            toolId: 'tu-1',
            input: { pattern: 'foo', path: '/src' },
            result: { content: 'found 3 matches' },
          },
        }),
      );
      await user.click(screen.getByText('Grep'));
      // Only ONE outer border box (not two separate bordered rows)
      const boxes = container.querySelectorAll('.border.border-border.bg-code-block');
      expect(boxes).toHaveLength(1);
      // IN/OUT labels are INSIDE the single box
      const box = boxes[0];
      expect(box).toContainElement(screen.getByText('IN'));
      expect(box).toContainElement(screen.getByText('OUT'));
    });

    it('Read tool result renders with syntax highlighting (no plain pre.bg-code-block)', async () => {
      const user = userEvent.setup();
      const { container } = render(
        renderBody({
          id: '1',
          role: 'assistant',
          type: 'tool_use',
          content: 'Read',
          timestamp: Date.now(),
          meta: {
            toolId: 'tu-1',
            input: { file_path: '/src/Foo.tsx' },
            result: { content: 'import React from "react";\nexport function Foo() {}' },
          },
        }),
      );
      await user.click(screen.getByText('Read'));
      // SyntaxHighlighter splits tokens into spans — check full textContent
      expect(container.textContent).toContain('import');
      expect(container.textContent).toContain('React');
      // plain <pre class="bg-code-block..."> should NOT be used for Read result
      expect(container.querySelector('pre.bg-code-block')).not.toBeInTheDocument();
    });

    it('renders TodoRead tool_use (visibility controlled by MessageVisibilityContext, not ToolUseBlock)', () => {
      const { container } = render(
        renderBody({
          id: '1',
          role: 'assistant',
          type: 'tool_use',
          content: 'TodoRead',
          timestamp: Date.now(),
          meta: { toolId: 'tu-2', input: {} },
        }),
      );
      // ToolUseBlock no longer hides TodoRead — filtering is done at MessageList level
      expect(container.innerHTML).not.toBe('');
      expect(container.textContent).toContain('TodoRead');
    });
  });

  describe('ToolResultBlock (via renderBody)', () => {
    it('renders tool_result with label', () => {
      render(
        renderBody({
          id: '1',
          role: 'assistant',
          type: 'tool_result',
          content: 'file contents here',
          timestamp: Date.now(),
          meta: { toolId: 'tu-1', name: 'Read' },
        }),
      );
      expect(screen.getByText('Result: Read')).toBeInTheDocument();
    });
  });

  describe('SystemBlocks (via renderBody)', () => {
    it('renders error message', () => {
      render(
        renderBody({
          id: '1',
          role: 'system',
          type: 'error',
          content: 'Something went wrong',
          timestamp: Date.now(),
        }),
      );
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders result stats', () => {
      render(
        renderBody({
          id: '1',
          role: 'system',
          type: 'result',
          content: '',
          timestamp: Date.now(),
          meta: {
            stats: {
              costUsd: 0.05,
              durationMs: 3000,
              inputTokens: 100,
              outputTokens: 50,
              numTurns: 1,
            },
          },
        }),
      );
      expect(screen.getByText('$0.0500')).toBeInTheDocument();
      expect(screen.getByText('1 turns')).toBeInTheDocument();
    });

    it('renders compact boundary', () => {
      render(
        renderBody({
          id: '1',
          role: 'system',
          type: 'compact_boundary',
          content: '',
          timestamp: Date.now(),
        }),
      );
      expect(screen.getByText('Context was compressed')).toBeInTheDocument();
    });

    it('renders control response with approved style', () => {
      render(
        renderBody({
          id: '1',
          role: 'user',
          type: 'action_result',
          content: 'Approved: Bash',
          timestamp: Date.now(),
        }),
      );
      expect(screen.getByText(/Approved: Bash/)).toBeInTheDocument();
    });
  });

  describe('HookBlocks (via renderBody)', () => {
    it('renders hook_started', () => {
      render(
        renderBody({
          id: '1',
          role: 'system',
          type: 'hook_started',
          content: 'pre-commit',
          timestamp: Date.now(),
        }),
      );
      expect(screen.getByText(/Running hook: pre-commit/)).toBeInTheDocument();
    });
  });

  describe('Other blocks (via renderBody)', () => {
    it('renders text with markdown', () => {
      render(
        renderBody({
          id: '1',
          role: 'assistant',
          type: 'text',
          content: 'Hello **world**',
          timestamp: Date.now(),
        }),
      );
      expect(screen.getByText('world')).toBeInTheDocument();
    });

    it('renders interrupt', () => {
      render(
        renderBody({
          id: '1',
          role: 'system',
          type: 'interrupt',
          content: '',
          timestamp: Date.now(),
        }),
      );
      expect(screen.getByText('Interrupted by user')).toBeInTheDocument();
    });
  });

  describe('Content block types (via renderBody)', () => {
    it('renders image content block with base64 src', () => {
      render(
        renderBody({
          id: '1',
          role: 'assistant',
          type: 'image',
          content: '',
          timestamp: Date.now(),
          meta: { source: { type: 'base64', media_type: 'image/png', data: 'iVBOR' } },
        }),
      );
      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img.getAttribute('src')).toContain('data:image/png;base64,iVBOR');
    });

    it('renders document content block with download button', () => {
      render(
        renderBody({
          id: '1',
          role: 'assistant',
          type: 'document',
          content: '',
          timestamp: Date.now(),
          meta: {
            title: 'report.pdf',
            source: { type: 'base64', media_type: 'application/pdf', data: 'JVBER' },
          },
        }),
      );
      expect(screen.getByText('report.pdf')).toBeInTheDocument();
    });

    it('renders redacted_thinking as placeholder', () => {
      render(
        renderBody({
          id: '1',
          role: 'assistant',
          type: 'redacted_thinking',
          content: '',
          timestamp: Date.now(),
        }),
      );
      expect(screen.getByText(/thinking.*redacted/i)).toBeInTheDocument();
    });

    it('renders tool_result with array content extracting text', async () => {
      const user = userEvent.setup();
      render(
        renderBody({
          id: '1',
          role: 'assistant',
          type: 'tool_result',
          content: '',
          timestamp: Date.now(),
          meta: {
            toolId: 'tu-1',
            name: 'Read',
            arrayContent: [
              { type: 'text', text: 'file contents here' },
              { type: 'tool_reference', tool_name: 'Read' },
            ],
          },
        }),
      );
      // Expand the collapsible block
      await user.click(screen.getByText(/Result: Read/));
      // Text from array rendered, tool_reference filtered
      expect(screen.getByText(/file contents here/)).toBeInTheDocument();
    });
  });

  describe('Task/Agent tool badge', () => {
    function makeTaskMessage(meta: Record<string, unknown>) {
      return {
        id: '1',
        role: 'assistant' as const,
        type: 'tool_use' as const,
        content: 'Task',
        timestamp: Date.now(),
        meta: { toolId: 'tu-task', input: {}, ...meta },
      };
    }

    it('renders no badge when Task tool has no status and no subagent_type', () => {
      const { container } = render(renderBody(makeTaskMessage({})));
      expect(container.querySelector('.font-mono')).not.toBeInTheDocument();
      expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
    });

    it('renders running badge when taskStatus is running', () => {
      render(renderBody(makeTaskMessage({ taskStatus: 'running' })));
      expect(screen.getByText(/Running/)).toBeInTheDocument();
    });

    it('renders done badge when taskStatus is completed', () => {
      render(renderBody(makeTaskMessage({ taskStatus: 'completed' })));
      expect(screen.getByText(/Done/)).toBeInTheDocument();
    });

    it('renders subagent_type chip when provided even without taskStatus', () => {
      render(renderBody(makeTaskMessage({ input: { subagent_type: 'general-purpose' } })));
      expect(screen.getByText('[general-purpose]')).toBeInTheDocument();
    });
  });
});
